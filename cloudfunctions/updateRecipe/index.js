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

function trim(value) {
  return typeof value === 'string' ? value.trim() : ''
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
  const recipe = event.recipe || {}

  if (!id) return fail('缺少菜谱 ID')
  if (!trim(recipe.title)) return fail('请输入菜谱标题')

  const [user, recipeRes] = await Promise.all([
    getUser(openid),
    db.collection(COLLECTIONS.RECIPES).doc(id).get()
  ])

  if (!user) return fail('请先登录')

  const existing = recipeRes.data
  const canEdit = existing.authorOpenid === openid || user.role === ROLES.ADMIN
  if (!canEdit) return fail('你没有权限编辑这个菜谱')

  const data = {
    title: trim(recipe.title),
    description: trim(recipe.description),
    coverImage: recipe.coverImage || '',
    images: Array.isArray(recipe.images) ? recipe.images : [],
    categoryId: recipe.categoryId || '',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    cookingTime: Number(recipe.cookingTime) || 0,
    difficulty: recipe.difficulty || 'medium',
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    tips: trim(recipe.tips),
    status: recipe.status || existing.status || 'draft',
    updatedAt: db.serverDate()
  }

  await db.collection(COLLECTIONS.RECIPES).doc(id).update({ data })

  return {
    success: true,
    id,
    recipe: {
      ...existing,
      ...data
    }
  }
}
