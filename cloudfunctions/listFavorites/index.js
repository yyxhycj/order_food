const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTIONS = {
  USERS: 'users',
  FAVORITES: 'favorites'
}

function fail(message) {
  return { success: false, message }
}

function toTime(value) {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  if (typeof value === 'string') return new Date(value).getTime() || 0
  if (value.$date) return new Date(value.$date).getTime() || 0
  return 0
}

async function getUser(openid) {
  const res = await db.collection(COLLECTIONS.USERS)
    .where({ openid, status: 'active' })
    .limit(1)
    .get()
  return res.data[0]
}

exports.main = async () => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const user = await getUser(openid)

  if (!user) return fail('请先登录')

  const res = await db.collection(COLLECTIONS.FAVORITES)
    .where({ userOpenid: openid })
    .limit(100)
    .get()
  const favorites = (res.data || []).sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))

  return {
    success: true,
    favorites
  }
}
