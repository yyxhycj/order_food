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
    text: item.text || item.description || '',
    image: item.image || '',
    sort: typeof item.sort === 'number' ? item.sort : index + 1
  }))
  const cookingTime = recipe.cookingTime || recipe.cooking_time || 0
  const favoriteCount = recipe.favoriteCount || recipe.collect_count || 0
  const wantCount = recipe.wantCount || recipe.want_count || 0
  const viewCount = recipe.viewCount || recipe.view_count || 0

  return {
    ...recipe,
    _id: recipe._id || recipe.id,
    title: recipe.title || recipe.name || '',
    description: recipe.description || '',
    coverImage: recipe.coverImage || recipe.main_image || recipe.image || '/images/recipe.png',
    categoryId: recipe.categoryId || recipe.category_id || '',
    authorOpenid: recipe.authorOpenid || recipe.creator_openid || '',
    authorName: recipe.authorName || recipe.creator_name || recipe.nickname || '朋友',
    ingredients,
    steps,
    cookingTime,
    difficulty: recipe.difficulty || 'medium',
    difficultyText: getDifficultyText(recipe.difficulty || 'medium'),
    tags: normalizeTags(recipe.tags || recipe.seasonal_tags),
    tips: recipe.tips || '',
    status: recipe.status || 'published',
    statusText: getRecipeStatusText(recipe.status || 'published'),
    viewCount,
    favoriteCount,
    wantCount,
    commentCount: recipe.commentCount || recipe.review_count || 0,
    createdAtText: formatFriendlyDate(recipe.createdAt || recipe.created_at),
    updatedAtText: formatFriendlyDate(recipe.updatedAt || recipe.updated_at)
  }
}

module.exports = {
  DIFFICULTY_TEXT,
  getDifficultyText,
  normalizeArray,
  normalizeTags,
  normalizeRecipe
}
