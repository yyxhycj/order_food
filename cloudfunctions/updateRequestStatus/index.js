const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTIONS = {
  USERS: 'users',
  REQUESTS: 'requests'
}
const ROLES = {
  ADMIN: 'admin'
}
const STATUS_TEXT = {
  pending: '等回应',
  accepted: '已安排',
  preparing: '在做了',
  done: '吃过了',
  declined: '改天吃',
  cancelled: '先不吃'
}
const TRANSITIONS = {
  pending: ['accepted', 'declined', 'cancelled'],
  accepted: ['preparing'],
  preparing: ['done'],
  done: [],
  declined: [],
  cancelled: []
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
  const id = event.id
  const nextStatus = event.status
  const note = (event.note || '').trim()

  if (!id) return fail('没找到这条点菜')
  if (!STATUS_TEXT[nextStatus]) return fail('点菜状态不对')

  const [user, requestRes] = await Promise.all([
    getUser(openid),
    db.collection(COLLECTIONS.REQUESTS).doc(id).get().catch(() => null)
  ])

  if (!user) return fail('请先登录')

  const request = requestRes && requestRes.data
  if (!request) return fail('这条点菜不见了')

  const isAdmin = user.role === ROLES.ADMIN
  const isAuthor = request.authorUserId === user._id
  const isRequesterCancelling = request.requesterUserId === user._id && nextStatus === 'cancelled'

  if (nextStatus === 'cancelled' && !isRequesterCancelling) {
    return fail('只有点菜的人可以取消')
  }

  if (nextStatus !== 'cancelled' && !isAdmin && !isAuthor) {
    return fail('你现在不能处理这条点菜')
  }

  if ((TRANSITIONS[request.status] || []).indexOf(nextStatus) < 0) {
    return fail('当前状态不能这样流转')
  }

  const data = {
    status: nextStatus,
    statusText: STATUS_TEXT[nextStatus],
    note,
    updatedAt: db.serverDate(),
    handledAt: db.serverDate()
  }

  await db.collection(COLLECTIONS.REQUESTS).doc(id).update({ data })

  return {
    success: true,
    id,
    request: {
      ...request,
      ...data
    }
  }
}
