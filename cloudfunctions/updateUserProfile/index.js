const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTIONS = {
  USERS: 'users'
}

function fail(message) {
  return { success: false, message }
}

function trim(value) {
  return typeof value === 'string' ? value.trim() : ''
}

async function getUser(openid) {
  const res = await db.collection(COLLECTIONS.USERS)
    .where({ openid, status: 'active' })
    .limit(1)
    .get()
  return res.data[0]
}

function toPublicUser(user) {
  return {
    _id: user._id,
    nickname: user.nickname || '家里人',
    avatarUrl: user.avatarUrl || '',
    bio: user.bio || '',
    role: user.role || 'user',
    status: user.status || 'active',
    recipeCount: user.recipeCount || 0,
    requestCount: user.requestCount || 0,
    updatedAt: user.updatedAt
  }
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const user = await getUser(wxContext.OPENID)
  const profile = event.profile || {}

  if (!user) return fail('请先登录')

  const nickname = trim(profile.nickname)
  if (!nickname) return fail('请输入昵称')
  if (nickname.length > 24) return fail('昵称最多 24 个字')

  const bio = trim(profile.bio)
  if (bio.length > 120) return fail('简介最多 120 个字')
  const now = db.serverDate()

  const patch = {
    nickname,
    avatarUrl: profile.avatarUrl || user.avatarUrl || '',
    bio,
    updatedAt: now
  }

  await db.collection(COLLECTIONS.USERS).doc(user._id).update({ data: patch })

  return {
    success: true,
    user: toPublicUser(Object.assign({}, user, patch, {
      updatedAt: new Date()
    }))
  }
}
