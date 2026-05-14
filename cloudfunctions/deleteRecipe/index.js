const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTIONS = {
  USERS: 'users',
  RECIPES: 'recipes'
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
  const id = event.id

  if (!id) return fail('没找到这道菜')

  const [user, recipeRes] = await Promise.all([
    getUser(openid),
    db.collection(COLLECTIONS.RECIPES).doc(id).get().catch(() => null)
  ])

  if (!user) return fail('请先登录')

  const recipe = recipeRes && recipeRes.data
  if (!recipe || recipe.status === 'deleted') return fail('这道菜不见了')

  const canDelete = recipe.authorUserId === user._id || user.role === ROLES.ADMIN
  if (!canDelete) return fail('你现在不能删这道菜')

  await db.collection(COLLECTIONS.RECIPES).doc(id).update({
    data: {
      status: 'deleted',
      updatedAt: db.serverDate()
    }
  })

  return { success: true, id }
}
