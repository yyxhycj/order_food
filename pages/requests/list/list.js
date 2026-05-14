const requestService = require('../../../services/request-service')
const { REQUEST_STATUS_OPTIONS } = require('../../../constants/request-status')
const { showError } = require('../../../utils/error')

Page({
  data: {
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
      const requests = await requestService.getMyRequests()
      this.setData({ requests })
      this.applyFilter()
    } catch (error) {
      showError(error, '加载想吃记录失败')
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
    if (e.detail.action !== 'cancel') return

    wx.showModal({
      title: '取消想吃',
      content: '确定取消这条想吃请求吗？',
      success: async res => {
        if (!res.confirm) return

        try {
          await requestService.cancelRequest(e.detail.id)
          wx.showToast({ title: '已取消', icon: 'success' })
          this.loadRequests()
        } catch (error) {
          showError(error, '取消失败')
        }
      }
    })
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
