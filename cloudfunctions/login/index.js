const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
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
const USER_LINK_SCHEMA_VERSION = 2
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

async function updateWhere(collectionName, query, data) {
  return db.collection(collectionName)
    .where(query)
    .update({ data })
    .catch(error => {
      console.warn(`补齐 ${collectionName} 用户关联失败`, error)
      return null
    })
}

// 只在登录时做一次旧数据清理；业务读写不再使用这些历史字段。
async function migrateUserLinksAndRemoveOldFields(user, openid) {
  const now = db.serverDate()
  const userPatch = {
    updatedAt: now
  }
  const recipePatch = Object.assign({}, userPatch, {
    authorUserId: user._id,
    authorOpenid: _.remove(),
    authorName: _.remove(),
    creator_openid: _.remove(),
    creator_name: _.remove()
  })
  const requesterPatch = Object.assign({}, userPatch, {
    requesterUserId: user._id,
    requesterOpenid: _.remove(),
    requesterName: _.remove()
  })
  const authorRequestPatch = Object.assign({}, userPatch, {
    authorUserId: user._id,
    authorOpenid: _.remove(),
    authorName: _.remove()
  })
  const favoritePatch = {
    userId: user._id,
    userOpenid: _.remove()
  }
  const commentPatch = Object.assign({}, userPatch, {
    userId: user._id,
    userOpenid: _.remove(),
    userName: _.remove(),
    userAvatar: _.remove(),
    userAvatarUrl: _.remove()
  })

  await Promise.all([
    updateWhere(COLLECTIONS.RECIPES, { authorUserId: user._id }, recipePatch),
    updateWhere(COLLECTIONS.RECIPES, { authorOpenid: openid }, recipePatch),
    updateWhere(COLLECTIONS.RECIPES, { creator_openid: openid }, recipePatch),
    updateWhere(COLLECTIONS.RECIPES, { _openid: openid }, recipePatch),
    updateWhere(COLLECTIONS.REQUESTS, { requesterUserId: user._id }, requesterPatch),
    updateWhere(COLLECTIONS.REQUESTS, { requesterOpenid: openid }, requesterPatch),
    updateWhere(COLLECTIONS.REQUESTS, { authorUserId: user._id }, authorRequestPatch),
    updateWhere(COLLECTIONS.REQUESTS, { authorOpenid: openid }, authorRequestPatch),
    updateWhere(COLLECTIONS.FAVORITES, { userId: user._id }, favoritePatch),
    updateWhere(COLLECTIONS.FAVORITES, { userOpenid: openid }, favoritePatch),
    updateWhere(COLLECTIONS.COMMENTS, { userId: user._id }, commentPatch),
    updateWhere(COLLECTIONS.COMMENTS, { userOpenid: openid }, commentPatch)
  ])
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
    patch.userLinkSchemaVersion = USER_LINK_SCHEMA_VERSION

    await db.collection(COLLECTIONS.USERS).doc(user._id).update({ data: patch })
    const nextUser = {
      ...user,
      ...patch,
      role
    }
    if (user.userLinkSchemaVersion !== USER_LINK_SCHEMA_VERSION) {
      await migrateUserLinksAndRemoveOldFields(nextUser, openid)
    }

    return {
      success: true,
      openid,
      user: nextUser,
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
    userLinkSchemaVersion: USER_LINK_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  }

  const addResult = await db.collection(COLLECTIONS.USERS).add({ data: userData })
  const nextUser = {
    _id: addResult._id,
    ...userData
  }
  await migrateUserLinksAndRemoveOldFields(nextUser, openid)

  return {
    success: true,
    openid,
    user: nextUser,
    isAdmin: defaultRole === ROLES.ADMIN
  }
}
