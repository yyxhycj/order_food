const requestService = require('../../../services/request-service')
const userService = require('../../../services/user-service')
const { REQUEST_STATUS, REQUEST_STATUS_OPTIONS } = require('../../../constants/request-status')
const { showError } = require('../../../utils/error')

const ACTION_STATUS = {
  accept: REQUEST_STATUS.ACCEPTED,
  decline: REQUEST_STATUS.DECLINED,
  prepare: REQUEST_STATUS.PREPARING,
  done: REQUEST_STATUS.DONE
}

const ACTION_NOTE = {
  accept: '先安排上',
  decline: '这次先改天',
  prepare: '已经开做',
  done: '已经吃上'
}

Page({
  data: {
    user: null,
    isAdmin: false,
    requests: [],
    filteredRequests: [],
    currentStatus: 'all',
    statusOptions: REQUEST_STATUS_OPTIONS,
    loading: true
  },

  onShow() {
    this.loadRequests()
  },

  async loadRequests() {
    this.setData({ loading: true })

    try {
      const user = await userService.getCurrentUser()
      const isAdmin = userService.isAdmin(user)
      const requests = isAdmin
        ? await requestService.getAllRequests()
        : await requestService.getReceivedRequests()

      this.setData({
        user,
        isAdmin,
        requests
      })
      this.applyFilter()
    } catch (error) {
      showError(error, '打开点菜记录失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  selectStatus(e) {
    this.setData({
      currentStatus: e.currentTarget.dataset.status
    })
    this.applyFilter()
  },

  applyFilter() {
    const status = this.data.currentStatus
    const filteredRequests = status === 'all'
      ? this.data.requests
      : this.data.requests.filter(item => item.status === status)

    this.setData({ filteredRequests })
  },

  async onRequestAction(e) {
    const action = e.detail.action
    const nextStatus = ACTION_STATUS[action]
    if (!nextStatus) return

    try {
      await requestService.updateRequestStatus(e.detail.id, nextStatus, ACTION_NOTE[action])
      wx.showToast({ title: '已更新', icon: 'success' })
      this.loadRequests()
    } catch (error) {
      showError(error, '没改成')
    }
  },

  goToRecipe(e) {
    const recipeId = e.detail.request.recipeId
    wx.navigateTo({
      url: `/pages/recipe/detail/detail?id=${recipeId}`
    })
  },

  goHome() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  }
})
