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

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const user = await getUser(openid)
  const isAdmin = Boolean(user && user.role === ROLES.ADMIN)
  const options = event.options || {}
  const query = {}
  const limit = normalizeLimit(options.limit)
  const page = Math.max(Number(options.page) || 0, 0)
  const requestedAuthor = options.authorOpenid

  if (options.includeHidden) {
    query.status = _.neq(RECIPE_STATUS.DELETED)

    if (requestedAuthor) {
      if (!isAdmin && (!user || requestedAuthor !== openid)) return fail('你没有权限查看这些菜谱')
      query.authorOpenid = requestedAuthor
    } else if (!isAdmin) {
      return fail('仅管理员可查看全部菜谱')
    }
  } else {
    query.status = options.status || RECIPE_STATUS.PUBLISHED
  }

  if (!options.includeHidden && requestedAuthor) {
    query.authorOpenid = requestedAuthor
  }

  if (options.categoryId && options.categoryId !== 'all') {
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
    !options.categoryId &&
    !options.authorOpenid &&
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
    recipes
  }
}
