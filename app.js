const cloudService = require('./services/cloud')
const userService = require('./services/user-service')

App({
  async onLaunch() {
    cloudService.initCloud({ env: 'cloud1-d8gnehyjub2a90508' })
    await this.login().catch(error => {
      console.warn('云开发登录暂不可用', error)

      const message = error && (error.errMsg || error.message || '')
      if (message.indexOf('-601034') >= 0 || message.indexOf('没有权限') >= 0) {
        wx.showModal({
          title: '需要开通云开发',
          content: '请在微信开发者工具顶部点击“云开发”，开通环境后部署 cloudfunctions 下的云函数。',
          showCancel: false
        })
      }
    })
  },

  globalData: {
    openid: '',
    userInfo: null,
    isAdmin: false
  },

  async login(profile = {}) {
    const result = await userService.login(profile)

    this.globalData.openid = result.openid
    this.globalData.userInfo = result.user
    this.globalData.isAdmin = result.isAdmin

    return result
  },

  async refreshUser() {
    const userInfo = await userService.getCurrentUser({ force: true })
    this.globalData.userInfo = userInfo
    this.globalData.isAdmin = userService.isAdmin(userInfo)
    return userInfo
  }
})
