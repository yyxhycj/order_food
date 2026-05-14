const { callFunction } = require('./cloud')
const cache = require('../utils/cache')

function clearFavoriteCaches() {
  cache.removePrefix('cache:v2:recipes:')
  cache.removePrefix('cache:v2:userStats:')
}

async function toggleFavorite(recipeId) {
  const result = await callFunction('toggleFavorite', { recipeId })
  clearFavoriteCaches()
  return result
}

async function isFavorite(recipeId) {
  const result = await callFunction('checkFavorite', { recipeId })
  return Boolean(result.favorite)
}

async function getFavorites() {
  const result = await callFunction('listFavorites')
  return result.favorites || []
}

module.exports = {
  toggleFavorite,
  isFavorite,
  getFavorites
}
