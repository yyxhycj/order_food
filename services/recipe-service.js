const COLLECTIONS = require('../constants/collections')
const { RECIPE_STATUS } = require('../constants/recipe-status')
const { getDb, callFunction } = require('./cloud')
const { normalizeRecipe } = require('../utils/format')

const DEFAULT_CATEGORIES = [
  { _id: 'homecook', name: '家常菜', icon: 'homecook', sort: 10, status: 'active', _fallback: true },
  { _id: 'dessert', name: '甜品', icon: 'dessert', sort: 20, status: 'active', _fallback: true },
  { _id: 'drink', name: '饮品', icon: 'drink', sort: 30, status: 'active', _fallback: true },
  { _id: 'quick', name: '快手菜', icon: 'quick', sort: 40, status: 'active', _fallback: true },
  { _id: 'party', name: '聚餐', icon: 'party', sort: 50, status: 'active', _fallback: true },
  { _id: 'other', name: '其他', icon: 'other', sort: 60, status: 'active', _fallback: true }
]

function sanitizeRecipe(recipe) {
  const data = recipe || {}
  return {
    title: (data.title || '').trim(),
    description: (data.description || '').trim(),
    coverImage: data.coverImage || '',
    images: Array.isArray(data.images) ? data.images : [],
    categoryId: data.categoryId || '',
    ingredients: (data.ingredients || [])
      .filter(item => item && item.name && item.amount)
      .map(item => ({
        name: item.name.trim(),
        amount: item.amount.trim()
      })),
    steps: (data.steps || [])
      .filter(item => item && item.text)
      .map((item, index) => ({
        text: item.text.trim(),
        image: item.image || '',
        sort: index + 1
      })),
    cookingTime: Number(data.cookingTime) || 0,
    difficulty: data.difficulty || 'medium',
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
    tips: (data.tips || '').trim(),
    status: data.status || RECIPE_STATUS.DRAFT
  }
}

function sanitizeCategory(category) {
  const data = category || {}
  return {
    name: (data.name || '').trim(),
    description: data.description || '',
    icon: data.icon || '',
    sort: Number(data.sort) || 0,
    status: data.status || 'active'
  }
}

async function getCategories(options = {}) {
  const result = await callFunction('listCategories', {
    includeInactive: Boolean(options.includeInactive)
  }).catch(() => null)
  const categories = result && result.categories

  if (categories && categories.length) return categories
  if (options.includeInactive) return []

  const db = getDb()
  const res = await db.collection(COLLECTIONS.CATEGORIES)
    .where({ status: 'active' })
    .orderBy('sort', 'asc')
    .get()

  return res.data && res.data.length ? res.data : DEFAULT_CATEGORIES
}

async function getRecipeList(options = {}) {
  const result = await callFunction('listRecipes', { options })
  return (result.recipes || []).map(normalizeRecipe)
}

async function getRecipeDetail(id) {
  const result = await callFunction('getRecipeDetail', { id })
  return normalizeRecipe(result.recipe)
}

async function createRecipe(recipe) {
  return callFunction('createRecipe', {
    recipe: sanitizeRecipe(recipe)
  })
}

async function updateRecipe(id, recipe) {
  return callFunction('updateRecipe', {
    id,
    recipe: sanitizeRecipe(recipe)
  })
}

async function deleteRecipe(id) {
  return callFunction('deleteRecipe', { id })
}

async function increaseViewCount(id) {
  return callFunction('increaseViewCount', { id }).catch(() => null)
}

async function addCategory(category) {
  return callFunction('saveCategory', {
    action: 'create',
    category: sanitizeCategory(category)
  })
}

async function updateCategory(id, category) {
  return callFunction('saveCategory', {
    action: 'update',
    id,
    category: sanitizeCategory(category)
  })
}

async function hideRecipe(id) {
  const recipe = await getRecipeDetail(id)
  return updateRecipe(id, {
    ...recipe,
    status: RECIPE_STATUS.HIDDEN
  })
}

async function publishRecipe(id) {
  const recipe = await getRecipeDetail(id)
  return updateRecipe(id, {
    ...recipe,
    status: RECIPE_STATUS.PUBLISHED
  })
}

module.exports = {
  DEFAULT_CATEGORIES,
  sanitizeRecipe,
  getCategories,
  getRecipeList,
  getRecipeDetail,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  increaseViewCount,
  addCategory,
  updateCategory,
  hideRecipe,
  publishRecipe
}
