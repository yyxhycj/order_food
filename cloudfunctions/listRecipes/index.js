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

async function getRecipesByAuthor(query, authorOpenid) {
  const fields = ['authorOpenid', 'creator_openid', '_openid']
  const resultMap = {}

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index]
    const authorQuery = Object.assign({}, query)
    authorQuery[field] = authorOpenid

    const res = await db.collection(COLLECTIONS.RECIPES)
      .where(authorQuery)
      .limit(100)
      .get()

    ;(res.data || []).forEach(recipe => {
      if (recipe && recipe._id) resultMap[recipe._id] = recipe
    })
  }

  return Object.keys(resultMap).map(id => resultMap[id])
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const options = event.options || {}
  const query = {}
  const limit = normalizeLimit(options.limit)
  const page = Math.max(Number(options.page) || 0, 0)
  const requestedAuthor = options.authorOpenid
  const hasCategoryFilter = options.categoryId && options.categoryId !== 'all'
  let user = null
  let isAdmin = false

  if (options.includeHidden) {
    user = await getUser(openid)
    isAdmin = Boolean(user && user.role === ROLES.ADMIN)
    query.status = _.neq(RECIPE_STATUS.DELETED)

    if (requestedAuthor) {
      if (!isAdmin && (!user || requestedAuthor !== openid)) return fail('你不能看这些菜')
    } else if (!isAdmin) {
      return fail('只有管小馆的人能看全部菜单')
    }
  } else {
    query.status = options.status || RECIPE_STATUS.PUBLISHED
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
    !options.authorOpenid &&
    !options.ids &&
    !options.keyword
  let recipes = []

  if (requestedAuthor) {
    recipes = sortRecipes(await getRecipesByAuthor(query, requestedAuthor), sort)
      .slice(page * limit, (page + 1) * limit)
  } else if (canUseDbSort) {
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
    recipes
  }
}
