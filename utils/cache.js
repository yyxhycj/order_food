function now() {
  return Date.now()
}

function get(key, maxAge = 5 * 60 * 1000) {
  try {
    const cached = wx.getStorageSync(key)
    if (!cached || !cached.savedAt) return null
    if (maxAge && now() - cached.savedAt > maxAge) return null
    return cached.value
  } catch (error) {
    return null
  }
}

function getAny(key) {
  try {
    const cached = wx.getStorageSync(key)
    return cached && cached.value ? cached.value : null
  } catch (error) {
    return null
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(key, {
      value,
      savedAt: now()
    })
  } catch (error) {
    // Cache failure should never block the app.
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(key)
  } catch (error) {
    // Cache failure should never block the app.
  }
}

function removePrefix(prefix) {
  try {
    const info = wx.getStorageInfoSync()
    ;(info.keys || []).forEach(key => {
      if (key.indexOf(prefix) === 0) wx.removeStorageSync(key)
    })
  } catch (error) {
    // Cache failure should never block the app.
  }
}

function stableStringify(value) {
  const data = value || {}
  const keys = Object.keys(data).sort()
  return JSON.stringify(keys.reduce((result, key) => {
    if (data[key] !== undefined) result[key] = data[key]
    return result
  }, {}))
}

module.exports = {
  get,
  getAny,
  set,
  remove,
  removePrefix,
  stableStringify
}
