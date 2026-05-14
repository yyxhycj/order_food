const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const COLLECTIONS = {
  USERS: 'users',
  RECIPES: 'recipes',
  COMMENTS: 'comments'
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
  const recipeId = event.recipeId
  const content = trim(event.content)

  if (!recipeId) return fail('没找到这道菜')
  if (!content) return fail('请输入留言内容')
  if (content.length > 200) return fail('留言最多 200 个字')

  const [user, recipeRes] = await Promise.all([
    getUser(openid),
    db.collection(COLLECTIONS.RECIPES).doc(recipeId).get().catch(() => null)
  ])

  if (!user) return fail('请先登录')

  const recipe = recipeRes && recipeRes.data
  if (!recipe || recipe.status !== 'published') return fail('这道菜暂时不能留言')

  const now = db.serverDate()
  const commentData = {
    recipeId,
    userId: user._id,
    content,
    status: 'visible',
    createdAt: now,
    updatedAt: now
  }
  const result = await db.collection(COLLECTIONS.COMMENTS).add({ data: commentData })

  await db.collection(COLLECTIONS.RECIPES).doc(recipeId).update({
    data: {
      commentCount: _.inc(1),
      updatedAt: now
    }
  })

  return {
    success: true,
    id: result._id,
    comment: Object.assign({}, commentData, {
      _id: result._id,
      nickname: user.nickname || '家里人',
      avatarUrl: user.avatarUrl || '',
      canDelete: true
    })
  }
}
