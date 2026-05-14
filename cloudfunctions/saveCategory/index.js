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

function sanitizeCategory(category = {}) {
  const name = trim(category.name)
  if (!name) return { error: '请输入分类名称' }
  if (name.length > 12) return { error: '分类名称最多 12 个字' }

  const description = trim(category.description)
  if (description.length > 60) return { error: '分类描述最多 60 个字' }

  return {
    data: {
      name,
      description,
      icon: trim(category.icon),
      sort: Number(category.sort) || 0,
      status: category.status === 'inactive' ? 'inactive' : 'active'
    }
  }
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const user = await getUser(wxContext.OPENID)

  if (!user) return fail('请先登录')
  if (user.role !== ROLES.ADMIN) return fail('仅管理员可操作分类')

  const normalized = sanitizeCategory(event.category)
  if (normalized.error) return fail(normalized.error)

  const now = db.serverDate()
  const data = {
    ...normalized.data,
    updatedAt: now
  }

  if (event.action === 'update') {
    if (!event.id) return fail('缺少分类 ID')
    await db.collection(COLLECTIONS.CATEGORIES).doc(event.id).update({ data })

    return {
      success: true,
      id: event.id,
      category: {
        _id: event.id,
        ...data,
        updatedAt: new Date()
      }
    }
  }

  const createData = {
    ...data,
    createdAt: now
  }
  const result = await db.collection(COLLECTIONS.CATEGORIES).add({ data: createData })

  return {
    success: true,
    id: result._id,
    category: {
      _id: result._id,
      ...createData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
}
