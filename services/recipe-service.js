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

async function getCategories() {
  const db = getDb()
  const res = await db.collection(COLLECTIONS.CATEGORIES)
    .where({ status: 'active' })
    .orderBy('sort', 'asc')
    .get()

  return res.data && res.data.length ? res.data : DEFAULT_CATEGORIES
}

async function getRecipeList(options = {}) {
  const db = getDb()
  const _ = db.command
  const limit = options.limit || 20
  const page = options.page || 0
  const query = {}

  if (!options.includeHidden) {
    query.status = options.status || RECIPE_STATUS.PUBLISHED
  } else if (options.status) {
    query.status = options.status
  } else {
    query.status = _.neq(RECIPE_STATUS.DELETED)
  }

  if (options.categoryId && options.categoryId !== 'all') {
    query.categoryId = options.categoryId
  }

  if (options.authorOpenid) {
    query.authorOpenid = options.authorOpenid
  }

  if (options.ids && options.ids.length) {
    query._id = _.in(options.ids)
  }

  if (options.keyword) {
    query.title = db.RegExp({
      regexp: options.keyword.trim(),
      options: 'i'
    })
  }

  const sortMap = {
    latest: ['createdAt', 'desc'],
    popular: ['wantCount', 'desc'],
    favorite: ['favoriteCount', 'desc'],
    view: ['viewCount', 'desc']
  }
  const sort = sortMap[options.sortBy || 'latest'] || sortMap.latest

  const res = await db.collection(COLLECTIONS.RECIPES)
    .where(query)
    .orderBy(sort[0], sort[1])
    .skip(page * limit)
    .limit(limit)
    .get()

  return (res.data || []).map(normalizeRecipe)
}

async function getRecipeDetail(id) {
  const db = getDb()
  const res = await db.collection(COLLECTIONS.RECIPES).doc(id).get()
  return normalizeRecipe(res.data)
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
  const db = getDb()
  const _ = db.command
  return db.collection(COLLECTIONS.RECIPES).doc(id).update({
    data: {
      viewCount: _.inc(1),
      updatedAt: db.serverDate()
    }
  }).catch(() => null)
}

async function addCategory(category) {
  const db = getDb()
  return db.collection(COLLECTIONS.CATEGORIES).add({
    data: {
      name: (category.name || '').trim(),
      description: category.description || '',
      icon: category.icon || '',
      sort: Number(category.sort) || 0,
      status: category.status || 'active',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
  })
}

async function updateCategory(id, category) {
  const db = getDb()
  return db.collection(COLLECTIONS.CATEGORIES).doc(id).update({
    data: {
      name: (category.name || '').trim(),
      description: category.description || '',
      icon: category.icon || '',
      sort: Number(category.sort) || 0,
      status: category.status || 'active',
      updatedAt: db.serverDate()
    }
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
