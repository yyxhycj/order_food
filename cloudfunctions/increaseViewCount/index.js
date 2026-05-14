const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const COLLECTIONS = {
  RECIPES: 'recipes'
}

function fail(message) {
  return { success: false, message }
}

exports.main = async (event = {}) => {
  const id = event.id
  if (!id) return fail('没找到这道菜')

  const recipeRes = await db.collection(COLLECTIONS.RECIPES).doc(id).get().catch(() => null)
  const recipe = recipeRes && recipeRes.data

  if (!recipe || recipe.status === 'deleted') return fail('这道菜不见了')

  await db.collection(COLLECTIONS.RECIPES).doc(id).update({
    data: {
      viewCount: _.inc(1),
      updatedAt: db.serverDate()
    }
  })

  return {
    success: true,
    id
  }
}
