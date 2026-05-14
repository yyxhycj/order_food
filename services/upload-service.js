const { initCloud } = require('./cloud')

function getExt(filePath) {
  const match = /\.[a-zA-Z0-9]+$/.exec(filePath || '')
  return match ? match[0] : '.jpg'
}

function buildCloudPath(filePath, folder) {
  const date = new Date()
  const month = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
  const random = Math.random().toString(16).slice(2)
  return `${folder}/${month}/${Date.now()}-${random}${getExt(filePath)}`
}

function uploadImage(filePath, folder = 'recipes') {
  initCloud()
  const cloudPath = buildCloudPath(filePath, folder)

  return wx.cloud.uploadFile({
    cloudPath,
    filePath
  }).then(res => res.fileID)
}

function chooseImage() {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => resolve(res.tempFilePaths[0]),
      fail: reject
    })
  })
}

async function chooseAndUploadImage(folder) {
  const filePath = await chooseImage()
  return uploadImage(filePath, folder)
}

function deleteFile(fileList) {
  initCloud()
  const files = Array.isArray(fileList) ? fileList : [fileList]
  return wx.cloud.deleteFile({
    fileList: files.filter(Boolean)
  })
}

module.exports = {
  uploadImage,
  chooseImage,
  chooseAndUploadImage,
  deleteFile
}
