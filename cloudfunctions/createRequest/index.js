const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const COLLECTIONS = {
  USERS: 'users',
  RECIPES: 'recipes',
  REQUESTS: 'requests'
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
  const reason = (event.reason || '').trim()

  if (!recipeId) return fail('缺少菜谱 ID')
  if (reason.length > 120) return fail('想吃理由最多 120 个字')

  const [user, recipeRes] = await Promise.all([
    getUser(openid),
    db.collection(COLLECTIONS.RECIPES).doc(recipeId).get()
  ])

  if (!user) return fail('请先登录')

  const recipe = recipeRes.data
  if (!recipe || recipe.status !== 'published') return fail('菜谱暂时不可请求')
  if (recipe.authorOpenid === openid) return fail('不能对自己发布的菜谱发起想吃请求')

  const now = db.serverDate()
  const requestData = {
    recipeId,
    recipeTitle: recipe.title,
    recipeCoverImage: recipe.coverImage || '',
    requesterOpenid: openid,
    requesterName: user.nickname || '朋友',
    authorOpenid: recipe.authorOpenid,
    authorName: recipe.authorName || '朋友',
    reason,
    status: 'pending',
    statusText: '待回应',
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
