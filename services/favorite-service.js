const COLLECTIONS = require('../constants/collections')
const { getDb, callFunction } = require('./cloud')
const userService = require('./user-service')

async function toggleFavorite(recipeId) {
  return callFunction('toggleFavorite', { recipeId })
}

async function isFavorite(recipeId) {
  const db = getDb()
  const user = await userService.getCurrentUser()
  const res = await db.collection(COLLECTIONS.FAVORITES)
    .where({
      recipeId,
      userOpenid: user.openid
    })
    .count()

  return (res.total || 0) > 0
}

async function getFavorites() {
  const db = getDb()
  const user = await userService.getCurrentUser()
  const res = await db.collection(COLLECTIONS.FAVORITES)
    .where({ userOpenid: user.openid })
    .orderBy('createdAt', 'desc')
    .get()

  return res.data || []
}

module.exports = {
  toggleFavorite,
  isFavorite,
  getFavorites
}
