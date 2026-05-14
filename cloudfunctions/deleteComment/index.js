const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const COLLECTIONS = {
  USERS: 'users',
  RECIPES: 'recipes',
  COMMENTS: 'comments'
}
const ROLES = {
  ADMIN: 'admin'
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
  const id = event.id

  if (!id) return fail('缺少留言 ID')

  const [user, commentRes] = await Promise.all([
    getUser(wxContext.OPENID),
    db.collection(COLLECTIONS.COMMENTS).doc(id).get().catch(() => null)
  ])

  if (!user) return fail('请先登录')

  const comment = commentRes && commentRes.data
  if (!comment || comment.status !== 'visible') return fail('留言不存在或已删除')

  const canDelete = user.role === ROLES.ADMIN || comment.userId === user._id
  if (!canDelete) return fail('你没有权限删除这条留言')

  const now = db.serverDate()
  await db.collection(COLLECTIONS.COMMENTS).doc(id).update({
    data: {
      status: 'deleted',
      updatedAt: now,
      deletedAt: now,
      deletedByUserId: user._id
    }
  })

  await db.collection(COLLECTIONS.RECIPES).doc(comment.recipeId).update({
    data: {
      commentCount: _.inc(-1),
      updatedAt: now
    }
  })

  return {
    success: true,
    id
  }
}
