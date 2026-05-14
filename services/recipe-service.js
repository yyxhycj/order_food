const { RECIPE_STATUS } = require('../constants/recipe-status')
const { callFunction } = require('./cloud')
const { normalizeRecipe } = require('../utils/format')
const userService = require('./user-service')
const cache = require('../utils/cache')

const CATEGORIES_CACHE_KEY = 'cache:v2:categories:active'
const CATEGORIES_CACHE_MAX_AGE = 24 * 60 * 60 * 1000
const RECIPE_LIST_CACHE_MAX_AGE = 2 * 60 * 1000

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
  if (!options.includeInactive) {
    const cached = cache.get(CATEGORIES_CACHE_KEY, CATEGORIES_CACHE_MAX_AGE)
    if (cached && cached.length) return cached
  }

  const result = await callFunction('listCategories', {
    includeInactive: Boolean(options.includeInactive)
  })
  const categories = result.categories

  if (Array.isArray(categories)) {
    if (options.includeInactive) return categories
    cache.set(CATEGORIES_CACHE_KEY, categories)
    return categories
  }
  return []
}

function getCachedCategories() {
  return cache.getAny(CATEGORIES_CACHE_KEY) || []
}

function getRecipeListCacheKey(options = {}) {
  return `cache:v2:recipes:${cache.stableStringify(options)}`
}

function getCachedRecipeList(options = {}) {
  return cache.getAny(getRecipeListCacheKey(options))
}

function clearRecipeCaches() {
  cache.removePrefix('cache:v2:recipes:')
  cache.removePrefix('cache:v2:userStats:')
}

function clearCategoryCaches() {
  cache.remove(CATEGORIES_CACHE_KEY)
  clearRecipeCaches()
}

function applyCurrentUserDisplayName(recipe) {
  const user = userService.getCachedUser()
  if (!recipe || !user || !user._id || recipe.authorUserId !== user._id) return recipe

  return Object.assign({}, recipe, {
    authorNickname: user.nickname || recipe.authorNickname || '家里人'
  })
}

async function getRecipeList(options = {}) {
  const forceRefresh = Boolean(options && options.forceRefresh)
  const queryOptions = {}
  Object.keys(options || {}).forEach(key => {
    if (key !== 'forceRefresh') queryOptions[key] = options[key]
  })
  const cacheKey = getRecipeListCacheKey(queryOptions)
  const cached = !forceRefresh ? cache.get(cacheKey, RECIPE_LIST_CACHE_MAX_AGE) : null
  if (cached) return cached

  const result = await callFunction('listRecipes', { options: queryOptions })
  const recipes = (result.recipes || [])
    .map(normalizeRecipe)
    .map(applyCurrentUserDisplayName)
  cache.set(cacheKey, recipes)
  return recipes
}

async function getRecipeDetail(id) {
  const result = await callFunction('getRecipeDetail', { id })
  const recipe = applyCurrentUserDisplayName(normalizeRecipe(result.recipe))
  return Object.assign({}, recipe, {
    canEdit: Boolean(result.canEdit),
    isOwner: Boolean(result.isOwner)
  })
}

async function createRecipe(recipe) {
  const result = await callFunction('createRecipe', {
    recipe: sanitizeRecipe(recipe)
  })
  clearRecipeCaches()
  return result
}

async function updateRecipe(id, recipe) {
  const result = await callFunction('updateRecipe', {
    id,
    recipe: sanitizeRecipe(recipe)
  })
  clearRecipeCaches()
  return result
}

async function deleteRecipe(id) {
  const result = await callFunction('deleteRecipe', { id })
  clearRecipeCaches()
  return result
}

async function increaseViewCount(id) {
  return callFunction('increaseViewCount', { id }).catch(() => null)
}

async function addCategory(category) {
  const result = await callFunction('saveCategory', {
    action: 'create',
    category: sanitizeCategory(category)
  })
  clearCategoryCaches()
  return result
}

async function updateCategory(id, category) {
  const result = await callFunction('saveCategory', {
    action: 'update',
    id,
    category: sanitizeCategory(category)
  })
  clearCategoryCaches()
  return result
}

async function hideRecipe(id) {
  const recipe = await getRecipeDetail(id)
  return updateRecipe(id, Object.assign({}, recipe, {
    status: RECIPE_STATUS.HIDDEN
  }))
}

async function publishRecipe(id) {
  const recipe = await getRecipeDetail(id)
  return updateRecipe(id, Object.assign({}, recipe, {
    status: RECIPE_STATUS.PUBLISHED
  }))
}

module.exports = {
  sanitizeRecipe,
  getCachedCategories,
  getCachedRecipeList,
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
