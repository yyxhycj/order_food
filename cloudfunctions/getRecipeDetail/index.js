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

function getRecipeOwnerOpenid(recipe) {
  return recipe && (recipe.authorOpenid || recipe.creator_openid || recipe._openid || '')
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
  if (!id) return fail('没找到这道菜')

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const [user, recipeRes] = await Promise.all([
    getUser(openid),
    db.collection(COLLECTIONS.RECIPES).doc(id).get().catch(() => null)
  ])
  const recipe = recipeRes && recipeRes.data

  if (!recipe || recipe.status === RECIPE_STATUS.DELETED) return fail('这道菜不见了')

  const isPublished = recipe.status === RECIPE_STATUS.PUBLISHED
  const isOwner = Boolean(user && getRecipeOwnerOpenid(recipe) === openid)
  const isAdmin = Boolean(user && user.role === ROLES.ADMIN)

  if (!isPublished && !isOwner && !isAdmin) return fail('你现在不能看这道菜')

  return {
    success: true,
    recipe: Object.assign({}, recipe, {
      authorOpenid: getRecipeOwnerOpenid(recipe)
    }),
    isOwner,
    canEdit: isOwner || isAdmin
  }
}
