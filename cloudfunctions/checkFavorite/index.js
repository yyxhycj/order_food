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
  const recipeId = event.recipeId

  if (!recipeId) return fail('没找到这道菜')

  const user = await getUser(openid)
  if (!user) return fail('请先登录')

  const res = await db.collection(COLLECTIONS.FAVORITES)
    .where({
      recipeId,
      userId: user._id
    })
    .limit(1)
    .get()

  return {
    success: true,
    favorite: Boolean(res.data && res.data.length)
  }
}
