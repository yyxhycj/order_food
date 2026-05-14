const { ROLES, isAdmin } = require('../constants/roles')
const { callFunction } = require('./cloud')

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
  const result = await callFunction('updateUserProfile', { profile })
  const nextUser = result.user

  setCachedUser(nextUser)

  return nextUser
}

async function getUserStats(openid) {
  const result = await callFunction('getUserStats', { openid })
  return result.stats || {
    recipeCount: 0,
    favoriteCount: 0,
    requestCount: 0,
    receivedRequestCount: 0
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
