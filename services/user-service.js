const { ROLES, isAdmin } = require('../constants/roles')
const { callFunction } = require('./cloud')
const cache = require('../utils/cache')

const STORAGE_KEY = 'currentUser'
const STATS_CACHE_MAX_AGE = 2 * 60 * 1000

function normalizeUser(user, openid) {
  if (!user) return null
  const nextUser = Object.assign({}, user)
  if (!nextUser.openid && openid) nextUser.openid = openid
  return nextUser.openid ? nextUser : null
}

function getCachedUser() {
  const user = normalizeUser(wx.getStorageSync(STORAGE_KEY) || null)
  if (!user) {
    wx.removeStorageSync(STORAGE_KEY)
    return null
  }
  return user
}

function setCachedUser(user, openid) {
  const nextUser = normalizeUser(user, openid)
  if (nextUser) wx.setStorageSync(STORAGE_KEY, nextUser)
}

async function login(profile = {}) {
  const result = await callFunction('login', { profile })
  const user = normalizeUser(result.user || null, result.openid)

  if (user) {
    setCachedUser(user, result.openid)
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
  const nextUser = normalizeUser(result.user)

  setCachedUser(nextUser)

  return nextUser
}

async function getUserStats(openid) {
  const cacheKey = `cache:v2:userStats:${openid || 'me'}`
  const cached = cache.get(cacheKey, STATS_CACHE_MAX_AGE)
  if (cached) return cached

  const result = await callFunction('getUserStats', { openid })
  const stats = result.stats || {
    recipeCount: 0,
    favoriteCount: 0,
    requestCount: 0,
    receivedRequestCount: 0
  }
  cache.set(cacheKey, stats)
  return stats
}

function getCachedUserStats(openid) {
  return cache.getAny(`cache:v2:userStats:${openid || 'me'}`)
}

function clearUserStatsCache() {
  cache.removePrefix('cache:v2:userStats:')
}

module.exports = {
  ROLES,
  login,
  getCachedUser,
  getCurrentUser,
  updateUserProfile,
  clearUserStatsCache,
  getCachedUserStats,
  getUserStats,
  isAdmin
}
