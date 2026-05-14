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

async function getUserById(id) {
  if (!id) return null
  const res = await db.collection(COLLECTIONS.USERS).doc(id).get().catch(() => null)
  const user = res && res.data
  return user && user.status === 'active' ? user : null
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const user = await getUser(openid)

  if (!user) return fail('请先登录')

  const targetUserId = event.userId || user._id
  const targetUser = await getUserById(targetUserId)

  if (!targetUser) return fail('这个家里人不存在')
  if (targetUser._id !== user._id && user.role !== ROLES.ADMIN) {
    return fail('你没有权限查看这个用户的数据')
  }

  const [recipes, favorites, myRequests, receivedRequests] = await Promise.all([
    db.collection(COLLECTIONS.RECIPES).where({ authorUserId: targetUser._id }).limit(100).get(),
    db.collection(COLLECTIONS.FAVORITES).where({ userId: targetUser._id }).limit(100).get(),
    db.collection(COLLECTIONS.REQUESTS).where({ requesterUserId: targetUser._id }).limit(100).get(),
    db.collection(COLLECTIONS.REQUESTS).where({ authorUserId: targetUser._id }).limit(100).get()
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
