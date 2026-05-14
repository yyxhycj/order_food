const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTIONS = {
  USERS: 'users',
  COMMENTS: 'comments'
}
const ROLES = {
  ADMIN: 'admin'
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
  if (!openid) return null

  const res = await db.collection(COLLECTIONS.USERS)
    .where({ openid, status: 'active' })
    .limit(1)
    .get()
  return res.data[0] || null
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const recipeId = event.recipeId

  if (!recipeId) return fail('没找到这道菜')

  const [user, commentsRes] = await Promise.all([
    getUser(openid),
    db.collection(COLLECTIONS.COMMENTS)
      .where({
        recipeId,
        status: 'visible'
      })
      .limit(100)
      .get()
  ])
  const isAdmin = Boolean(user && user.role === ROLES.ADMIN)
  const comments = (commentsRes.data || [])
    .sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt))
    .map(comment => ({
      ...comment,
      canDelete: isAdmin || comment.userOpenid === openid
    }))

  return {
    success: true,
    comments
  }
}
