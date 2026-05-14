let db = null
let initialized = false

function initCloud(options = {}) {
  if (!wx.cloud) {
    wx.showModal({
      title: '云开发不可用',
      content: '请使用 2.2.3 或以上基础库，并在微信开发者工具中开通云开发。',
      showCancel: false
    })
    return null
  }

  if (!initialized) {
    wx.cloud.init({
      traceUser: true,
      ...options
    })
    db = wx.cloud.database()
    initialized = true
  }

  return db
}

function getDb() {
  return db || initCloud()
}

function callFunction(name, data = {}) {
  initCloud()

  return wx.cloud.callFunction({
    name,
    data
  }).then(res => {
    const result = res.result || {}
    if (result.success === false) {
      const error = new Error(result.message || '云函数调用失败')
      error.result = result
      throw error
    }
    return result
  })
}

function getCollection(name) {
  return getDb().collection(name)
}

module.exports = {
  initCloud,
  getDb,
  getCollection,
  callFunction
}
