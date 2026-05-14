const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTIONS = {
  USERS: 'users'
}
const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
}

function getAdminOpenids() {
  return (process.env.ADMIN_OPENIDS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const profile = event.profile || {}
  const now = db.serverDate()
  const adminOpenids = getAdminOpenids()
  const defaultRole = adminOpenids.indexOf(openid) >= 0 ? ROLES.ADMIN : ROLES.USER

  const existing = await db.collection(COLLECTIONS.USERS)
    .where({ openid })
    .limit(1)
    .get()

  if (existing.data && existing.data.length) {
    const user = existing.data[0]
    const role = user.role || defaultRole
    const patch = {
      lastLoginAt: now,
      updatedAt: now
    }

    if (!user.role) patch.role = role
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
    nickname: profile.nickname || '新朋友',
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
