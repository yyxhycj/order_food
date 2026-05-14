const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTIONS = {
  USERS: 'users',
  REQUESTS: 'requests'
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
  const res = await db.collection(COLLECTIONS.USERS)
    .where({ openid, status: 'active' })
    .limit(1)
    .get()
  return res.data[0]
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

async function hydrateRequests(requests) {
  const ids = []
  ;(requests || []).forEach(request => {
    if (request.requesterUserId) ids.push(request.requesterUserId)
    if (request.authorUserId) ids.push(request.authorUserId)
  })

  const userMap = await getUsersByIds(ids)

  return (requests || []).map(request => {
    const requester = userMap[request.requesterUserId] || {}
    const author = userMap[request.authorUserId] || {}
    return Object.assign({}, request, {
      requesterNickname: requester.nickname || '家里人',
      authorNickname: author.nickname || '家里人'
    })
  })
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const mode = event.mode || 'mine'
  const user = await getUser(openid)

  if (!user) return fail('请先登录')

  const query = {}
  if (mode === 'all') {
    if (user.role !== ROLES.ADMIN) return fail('只有管小馆的人能看全部点菜记录')
  } else if (mode === 'received') {
    query.authorUserId = user._id
  } else {
    query.requesterUserId = user._id
  }

  const res = await db.collection(COLLECTIONS.REQUESTS)
    .where(query)
    .limit(100)
    .get()
  const requests = (res.data || []).sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))

  return {
    success: true,
    requests: await hydrateRequests(requests)
  }
}
