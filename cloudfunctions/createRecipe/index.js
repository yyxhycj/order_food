const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const COLLECTIONS = {
  USERS: 'users',
  RECIPES: 'recipes'
}
const RECIPE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published'
}
const ALLOWED_STATUSES = Object.keys(RECIPE_STATUS).map(key => RECIPE_STATUS[key])
const DIFFICULTIES = ['easy', 'medium', 'hard']

function fail(message) {
  return { success: false, message }
}

function trim(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function validate(recipe) {
  const status = recipe.status || RECIPE_STATUS.DRAFT
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const steps = Array.isArray(recipe.steps) ? recipe.steps : []

  if (!trim(recipe.title)) return '给这道菜起个名字'
  if (ALLOWED_STATUSES.indexOf(status) < 0) return '这道菜的状态不对'
  if (status === RECIPE_STATUS.PUBLISHED && !recipe.coverImage) return '加一张成品图吧'
  if (status === RECIPE_STATUS.PUBLISHED && !recipe.categoryId) return '请选择分类'
  if (!ingredients.filter(item => trim(item.name) && trim(item.amount)).length) return '请至少添加一个食材'
  if (!steps.filter(item => trim(item.text)).length) return '请至少添加一个步骤'
  return ''
}

function sanitizeRecipe(recipe) {
  const status = recipe.status === RECIPE_STATUS.PUBLISHED ? RECIPE_STATUS.PUBLISHED : RECIPE_STATUS.DRAFT
  const difficulty = DIFFICULTIES.indexOf(recipe.difficulty) >= 0 ? recipe.difficulty : 'medium'

  return {
    title: trim(recipe.title).slice(0, 60),
    description: trim(recipe.description).slice(0, 240),
    coverImage: recipe.coverImage || '',
    images: Array.isArray(recipe.images) ? recipe.images.slice(0, 9) : [],
    categoryId: recipe.categoryId || '',
    ingredients: (Array.isArray(recipe.ingredients) ? recipe.ingredients : [])
      .filter(item => trim(item.name) && trim(item.amount))
      .slice(0, 40)
      .map(item => ({
        name: trim(item.name).slice(0, 40),
        amount: trim(item.amount).slice(0, 40)
      })),
    steps: (Array.isArray(recipe.steps) ? recipe.steps : [])
      .filter(item => trim(item.text))
      .slice(0, 30)
      .map((item, index) => ({
        text: trim(item.text).slice(0, 500),
        image: item.image || '',
        sort: index + 1
      })),
    cookingTime: Math.max(Number(recipe.cookingTime) || 0, 0),
    difficulty,
    tags: (Array.isArray(recipe.tags) ? recipe.tags : [])
      .map(item => trim(item))
      .filter(Boolean)
      .slice(0, 12),
    tips: trim(recipe.tips).slice(0, 240),
    status
  }
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
  const recipe = sanitizeRecipe(event.recipe || {})
  const validationMessage = validate(recipe)

  if (validationMessage) return fail(validationMessage)

  const user = await getUser(openid)
  if (!user) return fail('请先登录')

  const now = db.serverDate()
  const data = {
    title: recipe.title,
    description: recipe.description,
    coverImage: recipe.coverImage,
    images: recipe.images,
    categoryId: recipe.categoryId,
    authorOpenid: openid,
    authorName: user.nickname || '家里人',
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    cookingTime: recipe.cookingTime,
    difficulty: recipe.difficulty,
    tags: recipe.tags,
    tips: recipe.tips,
    status: recipe.status,
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
