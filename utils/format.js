const { formatFriendlyDate } = require('./date')
const { getRecipeStatusText } = require('../constants/recipe-status')

const DIFFICULTY_TEXT = {
  easy: '简单',
  medium: '中等',
  hard: '有挑战'
}

function getDifficultyText(difficulty) {
  return DIFFICULTY_TEXT[difficulty] || '中等'
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.filter(Boolean)
  }

  if (typeof tags === 'string') {
    return tags.split(',').map(item => item.trim()).filter(Boolean)
  }

  return []
}

function normalizeRecipe(raw) {
  const recipe = raw || {}
  const ingredients = normalizeArray(recipe.ingredients).map(item => ({
    name: item.name || '',
    amount: item.amount || ''
  }))
  const steps = normalizeArray(recipe.steps).map((item, index) => ({
    text: item.text || '',
    image: item.image || '',
    sort: typeof item.sort === 'number' ? item.sort : index + 1
  }))

  return {
    _id: recipe._id || '',
    title: recipe.title || '',
    description: recipe.description || '',
    coverImage: recipe.coverImage || '/images/dish-placeholder.png',
    categoryId: recipe.categoryId || '',
    authorUserId: recipe.authorUserId || '',
    authorNickname: recipe.authorNickname || '家里人',
    authorAvatarUrl: recipe.authorAvatarUrl || '',
    ingredients,
    steps,
    cookingTime: recipe.cookingTime || 0,
    difficulty: recipe.difficulty || 'medium',
    difficultyText: getDifficultyText(recipe.difficulty || 'medium'),
    tags: normalizeTags(recipe.tags),
    tips: recipe.tips || '',
    status: recipe.status || 'published',
    statusText: getRecipeStatusText(recipe.status || 'published'),
    viewCount: recipe.viewCount || 0,
    favoriteCount: recipe.favoriteCount || 0,
    wantCount: recipe.wantCount || 0,
    commentCount: recipe.commentCount || 0,
    createdAtText: formatFriendlyDate(recipe.createdAt),
    updatedAtText: formatFriendlyDate(recipe.updatedAt)
  }
}

module.exports = {
  DIFFICULTY_TEXT,
  getDifficultyText,
  normalizeArray,
  normalizeTags,
  normalizeRecipe
}
