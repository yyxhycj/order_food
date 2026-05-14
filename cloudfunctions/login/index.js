const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTIONS = {
  USERS: 'users',
  CATEGORIES: 'categories',
  RECIPES: 'recipes',
  REQUESTS: 'requests',
  FAVORITES: 'favorites',
  COMMENTS: 'comments'
}
const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
}
const DEFAULT_CATEGORIES = [
  { _id: 'homecook', name: '家常菜', icon: 'homecook', sort: 10, status: 'active' },
  { _id: 'dessert', name: '甜品', icon: 'dessert', sort: 20, status: 'active' },
  { _id: 'drink', name: '饮品', icon: 'drink', sort: 30, status: 'active' },
  { _id: 'quick', name: '快手菜', icon: 'quick', sort: 40, status: 'active' },
  { _id: 'party', name: '聚餐', icon: 'party', sort: 50, status: 'active' },
  { _id: 'other', name: '其他', icon: 'other', sort: 60, status: 'active' }
]

function getAdminOpenids() {
  return (process.env.ADMIN_OPENIDS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

async function ensureCollection(name) {
  if (typeof db.createCollection !== 'function') return

  try {
    await db.createCollection(name)
  } catch (error) {
    const message = `${error && (error.errMsg || error.message || '')}`
    const isExists = message.indexOf('already exist') >= 0 ||
      message.indexOf('already exists') >= 0 ||
      message.indexOf('collection exists') >= 0

    if (!isExists) {
      console.warn(`集合 ${name} 创建跳过`, error)
    }
  }
}

async function ensureCollections() {
  await Promise.all(Object.keys(COLLECTIONS).map(key => ensureCollection(COLLECTIONS[key])))
}

async function ensureDefaultCategories() {
  const now = db.serverDate()

  await Promise.all(DEFAULT_CATEGORIES.map(category => {
    const { _id, ...data } = category

    return db.collection(COLLECTIONS.CATEGORIES).doc(_id).get()
      .catch(() => null)
      .then(existing => {
        if (existing && existing.data) return null

        return db.collection(COLLECTIONS.CATEGORIES).doc(_id).set({
          data: {
            ...data,
            createdAt: now,
            updatedAt: now
          }
        })
      })
  }))
}

async function hasAdmin() {
  const res = await db.collection(COLLECTIONS.USERS)
    .where({ role: ROLES.ADMIN, status: 'active' })
    .limit(1)
    .get()
  return Boolean(res.data && res.data.length)
}

async function hasActiveUser() {
  const res = await db.collection(COLLECTIONS.USERS)
    .where({ status: 'active' })
    .limit(1)
    .get()
  return Boolean(res.data && res.data.length)
}

exports.main = async (event = {}) => {
  await ensureCollections()
  await ensureDefaultCategories()

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const profile = event.profile || {}
  const now = db.serverDate()
  const adminOpenids = getAdminOpenids()
  const [adminExists, activeUserExists] = await Promise.all([
    hasAdmin(),
    hasActiveUser()
  ])
  const defaultRole = adminOpenids.indexOf(openid) >= 0 || (!adminExists && !activeUserExists) ? ROLES.ADMIN : ROLES.USER

  const existing = await db.collection(COLLECTIONS.USERS)
    .where({ openid })
    .limit(1)
    .get()

  if (existing.data && existing.data.length) {
    const user = existing.data[0]
    const role = defaultRole === ROLES.ADMIN ? ROLES.ADMIN : (user.role || defaultRole)
    const patch = {
      lastLoginAt: now,
      updatedAt: now
    }

    if (user.role !== role) patch.role = role
    if (profile.nickname) patch.nickname = profile.nickname
    if (profile.avatarUrl) patch.avatarUrl = profile.avatarUrl

    await db.collection(COLLECTIONS.USERS).doc(user._id).update({ data: patch })

    return {
      success: true,
      openid,
      user: {
        ...user,
        ...patch,
        role
      },
      isAdmin: role === ROLES.ADMIN
    }
  }

  const userData = {
    openid,
    nickname: profile.nickname || '家里人',
    avatarUrl: profile.avatarUrl || '',
    bio: '',
    role: defaultRole,
    status: 'active',
    recipeCount: 0,
    requestCount: 0,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  }

  const addResult = await db.collection(COLLECTIONS.USERS).add({ data: userData })

  return {
    success: true,
    openid,
    user: {
      _id: addResult._id,
      ...userData
    },
    isAdmin: defaultRole === ROLES.ADMIN
  }
}
