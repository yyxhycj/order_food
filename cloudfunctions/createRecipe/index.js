const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const COLLECTIONS = {
  USERS: 'users',
  RECIPES: 'recipes'
}

function fail(message) {
  return { success: false, message }
}

function trim(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function validate(recipe) {
  if (!trim(recipe.title)) return '请输入菜谱标题'
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return '请至少添加一个食材'
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) return '请至少添加一个步骤'
  return ''
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
  const recipe = event.recipe || {}
  const validationMessage = validate(recipe)

  if (validationMessage) return fail(validationMessage)

  const user = await getUser(openid)
  if (!user) return fail('请先登录')

  const now = db.serverDate()
  const data = {
    title: trim(recipe.title),
    description: trim(recipe.description),
    coverImage: recipe.coverImage || '',
    images: Array.isArray(recipe.images) ? recipe.images : [],
    categoryId: recipe.categoryId || '',
    authorOpenid: openid,
    authorName: user.nickname || '朋友',
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    cookingTime: Number(recipe.cookingTime) || 0,
    difficulty: recipe.difficulty || 'medium',
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    tips: trim(recipe.tips),
    status: recipe.status || 'draft',
    viewCount: 0,
    favoriteCount: 0,
    wantCount: 0,
    commentCount: 0,
    createdAt: now,
    updatedAt: now
  }

  const result = await db.collection(COLLECTIONS.RECIPES).add({ data })

  await db.collection(COLLECTIONS.USERS).doc(user._id).update({
    data: {
      recipeCount: _.inc(1),
      updatedAt: now
    }
  })

  return {
    success: true,
    id: result._id,
    recipe: {
      _id: result._id,
      ...data
    }
  }
}
