const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const COLLECTIONS = {
  USERS: 'users',
  RECIPES: 'recipes'
}
const ROLES = {
  ADMIN: 'admin'
}
const RECIPE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
  DELETED: 'deleted'
}

function fail(message) {
  return { success: false, message }
}

async function getUser(openid) {
  if (!openid) return null

  const res = await db.collection(COLLECTIONS.USERS)
    .where({ openid, status: 'active' })
    .limit(1)
    .get()
  return res.data[0] || null
}

function normalizeLimit(limit) {
  const value = Number(limit) || 20
  return Math.max(1, Math.min(value, 100))
}

function getSort(sortBy) {
  const sortMap = {
    latest: ['createdAt', 'desc'],
    popular: ['wantCount', 'desc'],
    favorite: ['favoriteCount', 'desc'],
    view: ['viewCount', 'desc']
  }

  return sortMap[sortBy || 'latest'] || sortMap.latest
}

function toTime(value) {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  if (typeof value === 'string') return new Date(value).getTime() || 0
  if (value.$date) return new Date(value.$date).getTime() || 0
  return 0
}

function sortRecipes(recipes, sort) {
  const field = sort[0]
  const direction = sort[1] === 'asc' ? 1 : -1

  return recipes.sort((a, b) => {
    const aValue = field === 'createdAt' ? toTime(a[field]) : Number(a[field]) || 0
    const bValue = field === 'createdAt' ? toTime(b[field]) : Number(b[field]) || 0
    return (aValue - bValue) * direction
  })
}

async function getUsersByIds(ids) {
  const uniqueIds = Array.from(new Set((ids || []).filter(Boolean)))
  if (!uniqueIds.length) return {}

  const res = await db.collection(COLLECTIONS.USERS)
    .where({
      _id: _.in(uniqueIds)
    })
    .limit(100)
    .get()

  return (res.data || []).reduce((map, user) => {
    map[user._id] = user
    return map
  }, {})
}

function serializeRecipe(recipe, author) {
  return {
    _id: recipe._id,
    title: recipe.title || '',
    description: recipe.description || '',
    coverImage: recipe.coverImage || '',
    images: Array.isArray(recipe.images) ? recipe.images : [],
    categoryId: recipe.categoryId || '',
    authorUserId: recipe.authorUserId || '',
    authorNickname: author && author.nickname ? author.nickname : '家里人',
    authorAvatarUrl: author && author.avatarUrl ? author.avatarUrl : '',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    cookingTime: Number(recipe.cookingTime) || 0,
    difficulty: recipe.difficulty || 'medium',
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    tips: recipe.tips || '',
    status: recipe.status || RECIPE_STATUS.PUBLISHED,
    viewCount: Number(recipe.viewCount) || 0,
    favoriteCount: Number(recipe.favoriteCount) || 0,
    wantCount: Number(recipe.wantCount) || 0,
    commentCount: Number(recipe.commentCount) || 0,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt
  }
}

async function hydrateRecipes(recipes) {
  const userMap = await getUsersByIds((recipes || []).map(recipe => recipe.authorUserId))

  return (recipes || []).map(recipe => {
    const author = userMap[recipe.authorUserId] || {}
    return serializeRecipe(recipe, author)
  })
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const options = event.options || {}
  const query = {}
  const limit = normalizeLimit(options.limit)
  const page = Math.max(Number(options.page) || 0, 0)
  const requestedAuthorUserId = options.authorUserId
  const hasCategoryFilter = options.categoryId && options.categoryId !== 'all'
  let user = null
  let isAdmin = false

  if (options.includeHidden) {
    user = await getUser(openid)
    isAdmin = Boolean(user && user.role === ROLES.ADMIN)
    query.status = _.neq(RECIPE_STATUS.DELETED)

    if (requestedAuthorUserId) {
      if (!isAdmin && (!user || requestedAuthorUserId !== user._id)) return fail('你不能看这些菜')
      query.authorUserId = requestedAuthorUserId
    } else if (!isAdmin) {
      return fail('只有管小馆的人能看全部菜单')
    }
  } else {
    query.status = options.status || RECIPE_STATUS.PUBLISHED
  }

  if (!options.includeHidden && requestedAuthorUserId) {
    query.authorUserId = requestedAuthorUserId
  }

  if (hasCategoryFilter) {
    query.categoryId = options.categoryId
  }

  if (Array.isArray(options.ids)) {
    if (!options.ids.length) {
      return {
        success: true,
        recipes: []
      }
    }
    query._id = _.in(options.ids.slice(0, 100))
  }

  if (options.keyword) {
    query.title = db.RegExp({
      regexp: String(options.keyword).trim(),
      options: 'i'
    })
  }

  const sort = getSort(options.sortBy)
  const canUseDbSort = sort[0] === 'createdAt' &&
    sort[1] === 'desc' &&
    query.status === RECIPE_STATUS.PUBLISHED &&
    !hasCategoryFilter &&
    !options.authorUserId &&
    !options.ids &&
    !options.keyword
  let recipes = []

  if (canUseDbSort) {
    const res = await db.collection(COLLECTIONS.RECIPES)
      .where(query)
      .orderBy(sort[0], sort[1])
      .skip(page * limit)
      .limit(limit)
      .get()
    recipes = res.data || []
  } else {
    const res = await db.collection(COLLECTIONS.RECIPES)
      .where(query)
      .limit(100)
      .get()
    recipes = sortRecipes(res.data || [], sort).slice(page * limit, (page + 1) * limit)
  }

  return {
    success: true,
    recipes: await hydrateRecipes(recipes)
  }
}
