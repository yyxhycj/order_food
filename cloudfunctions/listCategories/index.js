const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTIONS = {
  USERS: 'users',
  CATEGORIES: 'categories'
}
const ROLES = {
  ADMIN: 'admin'
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

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const includeInactive = Boolean(event.includeInactive)
  const query = {}

  if (includeInactive) {
    const user = await getUser(wxContext.OPENID)
    if (!user || user.role !== ROLES.ADMIN) return fail('仅管理员可查看全部分类')
  } else {
    query.status = 'active'
  }

  const res = await db.collection(COLLECTIONS.CATEGORIES)
    .where(query)
    .get()
  const categories = (res.data || []).sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0))

  return {
    success: true,
    categories
  }
}
