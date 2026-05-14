function getErrorMessage(error, fallback = '操作失败') {
  if (!error) return fallback
  if (typeof error === 'string') return error
  if (error.message) return error.message
  if (error.errMsg) return error.errMsg
  if (error.result && error.result.message) return error.result.message
  return fallback
}

function showError(error, fallback) {
  wx.showToast({
    title: getErrorMessage(error, fallback),
    icon: 'none'
  })
}

module.exports = {
  getErrorMessage,
  showError
}
