const { ROLES, isAdmin } = require('../constants/roles')
const { callFunction } = require('./cloud')
const cache = require('../utils/cache')

const STORAGE_KEY = 'currentUser'
const STATS_CACHE_MAX_AGE = 2 * 60 * 1000

function normalizeUser(user) {
  if (!user) return null
  if (!user._id) return null

  return {
    _id: user._id,
    nickname: user.nickname || '家里人',
    avatarUrl: user.avatarUrl || '',
    bio: user.bio || '',
    role: user.role || ROLES.USER,
    status: user.status || 'active',
    recipeCount: user.recipeCount || 0,
    requestCount: user.requestCount || 0
  }
}

function getCachedUser() {
  const user = normalizeUser(wx.getStorageSync(STORAGE_KEY) || null)
  if (!user) {
    wx.removeStorageSync(STORAGE_KEY)
    return null
  }
  return user
}

function setCachedUser(user) {
  const nextUser = normalizeUser(user)
  if (nextUser) wx.setStorageSync(STORAGE_KEY, nextUser)
}

async function login(profile = {}) {
  const result = await callFunction('login', { profile })
  const user = normalizeUser(result.user || null)

  if (user) {
    setCachedUser(user)
  }

  return {
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
  cache.removePrefix('cache:v2:recipes:')
  cache.removePrefix('cache:v2:requests:')
  cache.removePrefix('cache:v2:userStats:')

  return nextUser
}

async function getUserStats(userId) {
  const cacheKey = `cache:v2:userStats:${userId || 'me'}`
  const cached = cache.get(cacheKey, STATS_CACHE_MAX_AGE)
  if (cached) return cached

  const result = await callFunction('getUserStats', { userId })
  const stats = result.stats || {
    recipeCount: 0,
    favoriteCount: 0,
    requestCount: 0,
    receivedRequestCount: 0
  }
  cache.set(cacheKey, stats)
  return stats
}

function getCachedUserStats(userId) {
  return cache.getAny(`cache:v2:userStats:${userId || 'me'}`)
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
