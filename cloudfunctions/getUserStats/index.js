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
    db.collection(COLLECTIONS.RECIPES).where({ authorOpenid: targetOpenid }).limit(100).get(),
    db.collection(COLLECTIONS.FAVORITES).where({ userOpenid: targetOpenid }).limit(100).get(),
    db.collection(COLLECTIONS.REQUESTS).where({ requesterOpenid: targetOpenid }).limit(100).get(),
    db.collection(COLLECTIONS.REQUESTS).where({ authorOpenid: targetOpenid }).limit(100).get()
  ])

  return {
    success: true,
    stats: {
      recipeCount: (recipes.data || []).filter(item => item.status !== 'deleted').length,
      favoriteCount: (favorites.data || []).length,
      requestCount: (myRequests.data || []).length,
      receivedRequestCount: (receivedRequests.data || []).length
    }
  }
}
