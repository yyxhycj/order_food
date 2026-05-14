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

async function getUsersByIds(ids) {
  const uniqueIds = Array.from(new Set((ids || []).filter(Boolean)))
  if (!uniqueIds.length) return {}

  const res = await db.collection(COLLECTIONS.USERS)
    .where({
      _id: db.command.in(uniqueIds)
    })
    .limit(100)
    .get()

  return (res.data || []).reduce((map, item) => {
    map[item._id] = item
    return map
  }, {})
}

function serializeComment(comment, commentUser, canDelete) {
  return {
    _id: comment._id,
    recipeId: comment.recipeId || '',
    userId: comment.userId || '',
    nickname: commentUser && commentUser.nickname ? commentUser.nickname : '家里人',
    avatarUrl: commentUser && commentUser.avatarUrl ? commentUser.avatarUrl : '',
    content: comment.content || '',
    status: comment.status || 'visible',
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    canDelete
  }
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
  const sortedComments = (commentsRes.data || [])
    .sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt))
  const userMap = await getUsersByIds(sortedComments.map(comment => comment.userId))
  const comments = sortedComments
    .map(comment => {
      const commentUser = userMap[comment.userId] || {}
      return serializeComment(comment, commentUser, isAdmin || comment.userId === (user && user._id))
    })

  return {
    success: true,
    comments
  }
}
