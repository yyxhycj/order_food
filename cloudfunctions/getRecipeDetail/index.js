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

async function getUserById(id) {
  if (!id) return null
  const res = await db.collection(COLLECTIONS.USERS).doc(id).get().catch(() => null)
  return res && res.data ? res.data : null
}

function serializeRecipe(recipe, author) {
  return {
    _id: recipe._id,
    title: recipe.title || '',
    description: recipe.description || '',
    coverImage: recipe.coverImage || '',
    images: Array.isArray(recipe.images) ? recipe.images : [],
    categoryId: recipe.categoryId || '',
    authorUserId: recipe.authorUserId || '',
    authorNickname: author && author.nickname ? author.nickname : '家里人',
    authorAvatarUrl: author && author.avatarUrl ? author.avatarUrl : '',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    cookingTime: Number(recipe.cookingTime) || 0,
    difficulty: recipe.difficulty || 'medium',
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    tips: recipe.tips || '',
    status: recipe.status || RECIPE_STATUS.PUBLISHED,
    viewCount: Number(recipe.viewCount) || 0,
    favoriteCount: Number(recipe.favoriteCount) || 0,
    wantCount: Number(recipe.wantCount) || 0,
    commentCount: Number(recipe.commentCount) || 0,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt
  }
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
  const isOwner = Boolean(user && recipe.authorUserId === user._id)
  const isAdmin = Boolean(user && user.role === ROLES.ADMIN)
  const author = await getUserById(recipe.authorUserId)

  if (!isPublished && !isOwner && !isAdmin) return fail('你现在不能看这道菜')

  return {
    success: true,
    recipe: serializeRecipe(recipe, author),
    isOwner,
    canEdit: isOwner || isAdmin
  }
}
