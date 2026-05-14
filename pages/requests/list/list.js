const requestService = require('../../../services/request-service')
const { REQUEST_STATUS_OPTIONS } = require('../../../constants/request-status')
const { showError } = require('../../../utils/error')

Page({
  data: {
    requests: [],
    filteredRequests: [],
    currentStatus: 'all',
    statusOptions: REQUEST_STATUS_OPTIONS,
    loading: true,
    pendingCount: 0,
    arrangedCount: 0,
    doneCount: 0
  },

  onShow() {
    this.loadRequests()
  },

  async loadRequests() {
    const cachedRequests = requestService.getCachedRequests('mine')
    if (cachedRequests) {
      this.setData({
        requests: cachedRequests,
        loading: false
      })
      this.updateSummary(cachedRequests)
      this.applyFilter()
    } else {
      this.setData({ loading: true })
    }

    try {
      const requests = await requestService.getMyRequests()
      this.setData({ requests })
      this.updateSummary(requests)
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

  updateSummary(requests) {
    const list = requests || []
    this.setData({
      pendingCount: list.filter(item => item.status === 'pending').length,
      arrangedCount: list.filter(item => item.status === 'accepted' || item.status === 'preparing').length,
      doneCount: list.filter(item => item.status === 'done').length
    })
  },

  async onRequestAction(e) {
    if (e.detail.action !== 'cancel') return

    wx.showModal({
      title: '先不吃了？',
      content: '这条会从想吃里收起来，之后还可以再点。',
      success: async res => {
        if (!res.confirm) return

        try {
          await requestService.cancelRequest(e.detail.id)
          wx.showToast({ title: '先放下了', icon: 'success' })
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
  },

  goPlan() {
    wx.switchTab({
      url: '/pages/plan/plan'
    })
  }
})
