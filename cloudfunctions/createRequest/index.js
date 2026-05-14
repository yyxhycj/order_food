const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const COLLECTIONS = {
  USERS: 'users',
  RECIPES: 'recipes',
  REQUESTS: 'requests'
}
const ACTIVE_REQUEST_STATUS = ['pending', 'accepted', 'preparing']

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
  const reason = (event.reason || '').trim()

  if (!recipeId) return fail('没找到这道菜')
  if (reason.length > 120) return fail('想吃理由最多 120 个字')

  const [user, recipeRes] = await Promise.all([
    getUser(openid),
    db.collection(COLLECTIONS.RECIPES).doc(recipeId).get().catch(() => null)
  ])

  if (!user) return fail('请先登录')

  const recipe = recipeRes && recipeRes.data
  if (!recipe || recipe.status !== 'published') return fail('这道菜现在点不了')
  if (!recipe.authorUserId) return fail('这道菜还没关联到家里人，请重新打开小程序')

  const duplicate = await db.collection(COLLECTIONS.REQUESTS)
    .where({
      recipeId,
      requesterUserId: user._id,
      status: _.in(ACTIVE_REQUEST_STATUS)
    })
    .limit(1)
    .get()

  if (duplicate.data && duplicate.data.length) {
    return fail('已经放进想吃了，先等等')
  }

  const now = db.serverDate()
  const requestData = {
    recipeId,
    recipeTitle: recipe.title,
    recipeCoverImage: recipe.coverImage || '',
    requesterUserId: user._id,
    authorUserId: recipe.authorUserId,
    reason,
    status: 'pending',
    statusText: '等回应',
    note: '',
    createdAt: now,
    updatedAt: now,
    handledAt: null
  }

  const result = await db.collection(COLLECTIONS.REQUESTS).add({ data: requestData })

  await Promise.all([
    db.collection(COLLECTIONS.RECIPES).doc(recipeId).update({
      data: {
        wantCount: _.inc(1),
        updatedAt: now
      }
    }),
    db.collection(COLLECTIONS.USERS).doc(user._id).update({
      data: {
        requestCount: _.inc(1),
        updatedAt: now
      }
    })
  ])

  return {
    success: true,
    id: result._id,
    request: {
      _id: result._id,
      ...requestData
    }
  }
}
