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
const RECIPE_STATUS = {
  PUBLISHED: 'published',
  DELETED: 'deleted'
}

function fail(message) {
  return { success: false, message }
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
  const id = event.id
  if (!id) return fail('缺少菜谱 ID')

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const [user, recipeRes] = await Promise.all([
    getUser(openid),
    db.collection(COLLECTIONS.RECIPES).doc(id).get().catch(() => null)
  ])
  const recipe = recipeRes && recipeRes.data

  if (!recipe || recipe.status === RECIPE_STATUS.DELETED) return fail('菜谱不存在')

  const isPublished = recipe.status === RECIPE_STATUS.PUBLISHED
  const isOwner = Boolean(user && recipe.authorOpenid === openid)
  const isAdmin = Boolean(user && user.role === ROLES.ADMIN)

  if (!isPublished && !isOwner && !isAdmin) return fail('你没有权限查看这个菜谱')

  return {
    success: true,
    recipe,
    canEdit: isOwner || isAdmin
  }
}
