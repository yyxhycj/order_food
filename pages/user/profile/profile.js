const userService = require('../../../services/user-service')
const uploadService = require('../../../services/upload-service')
const { showError } = require('../../../utils/error')

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
    this.setData({ loading: true })

    try {
      const userInfo = await userService.getCurrentUser()
      const stats = await userService.getUserStats(userInfo.openid)

      this.setData({
        userInfo,
        stats,
        isAdmin: userService.isAdmin(userInfo),
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

  goToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin/admin'
    })
  },

  noop() {}
})
