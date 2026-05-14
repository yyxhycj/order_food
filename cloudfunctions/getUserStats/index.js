const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTIONS = {
  USERS: 'users',
  RECIPES: 'recipes',
  FAVORITES: 'favorites',
  REQUESTS: 'requests'
}
const ROLES = {
  ADMIN: 'admin'
}

function fail(message) {
  return { success: false, message }
}

async function getByOpenidFields(collectionName, fields, openid) {
  const resultMap = {}

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index]
    const query = {}
    query[field] = openid

    const res = await db.collection(collectionName).where(query).limit(100).get()
    ;(res.data || []).forEach(item => {
      if (item && item._id) resultMap[item._id] = item
    })
  }

  return Object.keys(resultMap).map(id => resultMap[id])
}

async function getUser(openid) {
  const res = await db.collection(COLLECTIONS.USERS)
    .where({ openid, status: 'active' })
    .limit(1)
    .get()
  return res.data[0]
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const user = await getUser(openid)

  if (!user) return fail('请先登录')

  const targetOpenid = event.openid || openid
  if (targetOpenid !== openid && user.role !== ROLES.ADMIN) {
    return fail('你没有权限查看这个用户的数据')
  }

  const [recipes, favorites, myRequests, receivedRequests] = await Promise.all([
    getByOpenidFields(COLLECTIONS.RECIPES, ['authorOpenid', 'creator_openid', '_openid'], targetOpenid),
    db.collection(COLLECTIONS.FAVORITES).where({ userOpenid: targetOpenid }).limit(100).get(),
    db.collection(COLLECTIONS.REQUESTS).where({ requesterOpenid: targetOpenid }).limit(100).get(),
    db.collection(COLLECTIONS.REQUESTS).where({ authorOpenid: targetOpenid }).limit(100).get()
  ])

  return {
    success: true,
    stats: {
      recipeCount: (recipes || []).filter(item => item.status !== 'deleted').length,
      favoriteCount: (favorites.data || []).length,
      requestCount: (myRequests.data || []).length,
      receivedRequestCount: (receivedRequests.data || []).length
    }
  }
}
