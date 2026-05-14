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
  pending: '待回应',
  accepted: '已接受',
  preparing: '准备中',
  done: '已完成',
  declined: '已婉拒',
  cancelled: '已取消'
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

  if (!id) return fail('缺少请求 ID')
  if (!STATUS_TEXT[nextStatus]) return fail('请求状态不合法')

  const [user, requestRes] = await Promise.all([
    getUser(openid),
    db.collection(COLLECTIONS.REQUESTS).doc(id).get()
  ])

  if (!user) return fail('请先登录')

  const request = requestRes.data
  const isAdmin = user.role === ROLES.ADMIN
  const isAuthor = request.authorOpenid === openid
  const isRequesterCancelling = request.requesterOpenid === openid && nextStatus === 'cancelled'

  if (!isAdmin && !isAuthor && !isRequesterCancelling) {
    return fail('你没有权限处理这个请求')
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
