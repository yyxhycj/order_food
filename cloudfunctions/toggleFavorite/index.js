const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const COLLECTIONS = {
  USERS: 'users',
  RECIPES: 'recipes',
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

  const [user, recipeRes] = await Promise.all([
    getUser(openid),
    db.collection(COLLECTIONS.RECIPES).doc(recipeId).get().catch(() => null)
  ])
  if (!user) return fail('请先登录')

  const recipe = recipeRes && recipeRes.data
  if (!recipe || recipe.status !== 'published') return fail('这道菜暂时留不了')

  const existing = await db.collection(COLLECTIONS.FAVORITES)
    .where({
      recipeId,
      userId: user._id
    })
    .get()

  if (existing.data && existing.data.length) {
    await Promise.all(existing.data.map(item => (
      db.collection(COLLECTIONS.FAVORITES).doc(item._id).remove()
    )))
    await db.collection(COLLECTIONS.RECIPES).doc(recipeId).update({
      data: {
        favoriteCount: _.inc(-existing.data.length),
        updatedAt: db.serverDate()
      }
    })

    return {
      success: true,
      favorite: false
    }
  }

  await db.collection(COLLECTIONS.FAVORITES).add({
    data: {
      recipeId,
      userId: user._id,
      createdAt: db.serverDate()
    }
  })
  await db.collection(COLLECTIONS.RECIPES).doc(recipeId).update({
    data: {
      favoriteCount: _.inc(1),
      updatedAt: db.serverDate()
    }
  })

  return {
    success: true,
    favorite: true
  }
}
