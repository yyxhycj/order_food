const userService = require('../../../services/user-service')
const uploadService = require('../../../services/upload-service')
const requestService = require('../../../services/request-service')
const { showError } = require('../../../utils/error')

const CHEF_MODE_KEY = 'familyMenuChefMode'
const CHEF_MODE_TEXT = {
  simple: '今天可以简单做',
  rest: '今天想休息',
  together: '想一起弄'
}

Page({
  data: {
    userInfo: null,
    stats: {
      recipeCount: 0,
      favoriteCount: 0,
      requestCount: 0,
      receivedRequestCount: 0
    },
    isAdmin: false,
    loading: true,
    chefMode: 'simple',
    chefModeText: CHEF_MODE_TEXT.simple,
    pendingRequests: [],
    showEditModal: false,
    editForm: {
      nickname: '',
      bio: ''
    }
  },

  onShow() {
    this.loadProfile()
  },

  async loadProfile() {
    const cachedUser = userService.getCachedUser()
    const cachedStats = cachedUser ? userService.getCachedUserStats(cachedUser._id) : null
    const cachedReceivedRequests = requestService.getCachedRequests('received') || []
    const savedChefMode = wx.getStorageSync(CHEF_MODE_KEY) || 'simple'
    const cachedChefMode = CHEF_MODE_TEXT[savedChefMode] ? savedChefMode : 'simple'

    if (cachedUser) {
      this.setData({
        userInfo: cachedUser,
        stats: cachedStats || this.data.stats,
        isAdmin: userService.isAdmin(cachedUser),
        chefMode: cachedChefMode,
        chefModeText: CHEF_MODE_TEXT[cachedChefMode],
        pendingRequests: this.getPendingRequests(cachedReceivedRequests),
        editForm: {
          nickname: cachedUser.nickname || '',
          bio: cachedUser.bio || ''
        },
        loading: false
      })
    } else {
      this.setData({ loading: true })
    }

    try {
      const userInfo = await userService.getCurrentUser()
      const results = await Promise.all([
        userService.getUserStats(userInfo._id),
        requestService.getReceivedRequests().catch(() => [])
      ])
      const stats = results[0] || this.data.stats
      const receivedRequests = results[1] || []

      this.setData({
        userInfo,
        stats,
        isAdmin: userService.isAdmin(userInfo),
        chefMode: cachedChefMode,
        chefModeText: CHEF_MODE_TEXT[cachedChefMode],
        pendingRequests: this.getPendingRequests(receivedRequests),
        editForm: {
          nickname: userInfo.nickname || '',
          bio: userInfo.bio || ''
        }
      })
    } catch (error) {
      showError(error, '加载个人资料失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  getPendingRequests(requests) {
    return (requests || [])
      .filter(item => item.status === 'pending' || item.status === 'accepted')
      .slice(0, 2)
  },

  selectChefMode(e) {
    const chefMode = e.currentTarget.dataset.mode
    if (!CHEF_MODE_TEXT[chefMode]) return

    wx.setStorageSync(CHEF_MODE_KEY, chefMode)
    this.setData({
      chefMode,
      chefModeText: CHEF_MODE_TEXT[chefMode]
    })
  },

  openEditModal() {
    this.setData({ showEditModal: true })
  },

  closeEditModal() {
    this.setData({ showEditModal: false })
  },

  onNicknameInput(e) {
    this.setData({
      'editForm.nickname': e.detail.value
    })
  },

  onBioInput(e) {
    this.setData({
      'editForm.bio': e.detail.value
    })
  },

  async saveProfile() {
    const nickname = (this.data.editForm.nickname || '').trim()
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    try {
      const userInfo = await userService.updateUserProfile({
        nickname,
        bio: this.data.editForm.bio,
        avatarUrl: this.data.userInfo.avatarUrl
      })

      this.setData({
        userInfo,
        showEditModal: false
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (error) {
      showError(error, '保存失败')
    }
  },

  async changeAvatar() {
    wx.showLoading({ title: '上传中' })

    try {
      const avatarUrl = await uploadService.chooseAndUploadImage('users/avatar')
      const userInfo = await userService.updateUserProfile({
        nickname: this.data.userInfo.nickname,
        bio: this.data.userInfo.bio,
        avatarUrl
      })

      this.setData({ userInfo })
      wx.showToast({ title: '头像已更新', icon: 'success' })
    } catch (error) {
      showError(error, '上传头像失败')
    } finally {
      wx.hideLoading()
    }
  },

  goToCreate() {
    wx.navigateTo({
      url: '/pages/recipe/edit/edit'
    })
  },

  goToMyRecipes() {
    wx.navigateTo({
      url: '/pages/admin/recipes/recipes?scope=mine'
    })
  },

  goToFavorites() {
    wx.navigateTo({
      url: '/pages/admin/recipes/recipes?scope=favorites'
    })
  },

  goToMyRequests() {
    wx.switchTab({
      url: '/pages/requests/list/list'
    })
  },

  goToReceivedRequests() {
    wx.navigateTo({
      url: '/pages/requests/manage/manage'
    })
  },

  goToPlan() {
    wx.switchTab({
      url: '/pages/plan/plan'
    })
  },

  goToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin/admin'
    })
  },

  noop() {}
})
