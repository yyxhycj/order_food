const cloudService = require('./services/cloud')
const userService = require('./services/user-service')

App({
  async onLaunch() {
    cloudService.initCloud()
    await this.login().catch(error => {
      console.error('登录失败', error)
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
