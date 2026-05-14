const COLLECTIONS = require('../constants/collections')
const { ROLES, isAdmin } = require('../constants/roles')
const { getDb, callFunction } = require('./cloud')

const STORAGE_KEY = 'currentUser'

function getCachedUser() {
  return wx.getStorageSync(STORAGE_KEY) || null
}

function setCachedUser(user) {
  wx.setStorageSync(STORAGE_KEY, user)
}

async function login(profile = {}) {
  const result = await callFunction('login', { profile })
  const user = result.user || null

  if (user) {
    setCachedUser(user)
  }

  return {
    openid: result.openid,
    user,
    isAdmin: Boolean(result.isAdmin)
  }
}

async function getCurrentUser(options = {}) {
  const cached = getCachedUser()
  if (cached && !options.force) return cached

  const result = await login(options.profile || {})
  return result.user
}

async function updateUserProfile(profile) {
  const db = getDb()
  const user = await getCurrentUser()
  const data = {
    nickname: profile.nickname || '',
    avatarUrl: profile.avatarUrl || user.avatarUrl || '',
    bio: profile.bio || '',
    updatedAt: db.serverDate()
  }

  await db.collection(COLLECTIONS.USERS).doc(user._id).update({ data })
  const nextUser = {
    ...user,
    ...data,
    updatedAt: new Date()
  }
  setCachedUser(nextUser)

  return nextUser
}

async function getUserStats(openid) {
  const db = getDb()
  const targetOpenid = openid || (await getCurrentUser()).openid
  const _ = db.command

  const [recipes, favorites, myRequests, receivedRequests] = await Promise.all([
    db.collection(COLLECTIONS.RECIPES).where({
      authorOpenid: targetOpenid,
      status: _.neq('deleted')
    }).count(),
    db.collection(COLLECTIONS.FAVORITES).where({ userOpenid: targetOpenid }).count(),
    db.collection(COLLECTIONS.REQUESTS).where({ requesterOpenid: targetOpenid }).count(),
    db.collection(COLLECTIONS.REQUESTS).where({ authorOpenid: targetOpenid }).count()
  ])

  return {
    recipeCount: recipes.total || 0,
    favoriteCount: favorites.total || 0,
    requestCount: myRequests.total || 0,
    receivedRequestCount: receivedRequests.total || 0
  }
}

module.exports = {
  ROLES,
  login,
  getCachedUser,
  getCurrentUser,
  updateUserProfile,
  getUserStats,
  isAdmin
}
