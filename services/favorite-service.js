const { callFunction } = require('./cloud')

async function toggleFavorite(recipeId) {
  return callFunction('toggleFavorite', { recipeId })
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
