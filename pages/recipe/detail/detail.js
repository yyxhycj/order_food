const recipeService = require('../../../services/recipe-service')
const favoriteService = require('../../../services/favorite-service')
const requestService = require('../../../services/request-service')
const userService = require('../../../services/user-service')
const { showError } = require('../../../utils/error')
const { validateRequestReason } = require('../../../utils/validator')

Page({
  data: {
    id: '',
    recipe: null,
    currentUser: null,
    loading: true,
    isFavorite: false,
    isOwner: false,
    isAdmin: false,
    showRequestModal: false,
    requestReason: '',
    submittingRequest: false
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '缺少菜谱 ID', icon: 'none' })
      wx.navigateBack()
      return
    }

    this.setData({ id: options.id })
    this.loadDetail()
  },

  async loadDetail() {
    this.setData({ loading: true })

    try {
      const [recipe, user] = await Promise.all([
        recipeService.getRecipeDetail(this.data.id),
        userService.getCurrentUser().catch(() => null)
      ])
      const isFavorite = user ? await favoriteService.isFavorite(this.data.id).catch(() => false) : false
      const isAdmin = userService.isAdmin(user)

      this.setData({
        recipe,
        currentUser: user,
        isFavorite,
        isOwner: Boolean(user && recipe.authorOpenid === user.openid),
        isAdmin
      })

      wx.setNavigationBarTitle({ title: recipe.title || '菜谱详情' })
      recipeService.increaseViewCount(this.data.id)
    } catch (error) {
      showError(error, '加载菜谱失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  async toggleFavorite() {
    try {
      const result = await favoriteService.toggleFavorite(this.data.id)
      const favorite = Boolean(result.favorite)
      const delta = favorite ? 1 : -1
      const recipe = {
        ...this.data.recipe,
        favoriteCount: Math.max((this.data.recipe.favoriteCount || 0) + delta, 0)
      }

      this.setData({
        isFavorite: favorite,
        recipe
      })
      wx.showToast({
        title: favorite ? '已收藏' : '已取消收藏',
        icon: 'success'
      })
    } catch (error) {
      showError(error, '收藏失败')
    }
  },

  openRequestModal() {
    this.setData({
      showRequestModal: true,
      requestReason: ''
    })
  },

  closeRequestModal() {
    this.setData({
      showRequestModal: false,
      submittingRequest: false
    })
  },

  onReasonInput(e) {
    this.setData({
      requestReason: e.detail.value
    })
  },

  async submitRequest() {
    const validation = validateRequestReason(this.data.requestReason)
    if (!validation.valid) {
      wx.showToast({ title: validation.message, icon: 'none' })
      return
    }

    this.setData({ submittingRequest: true })

    try {
      await requestService.createRequest(this.data.recipe, this.data.requestReason)
      this.setData({
        showRequestModal: false,
        submittingRequest: false,
        recipe: {
          ...this.data.recipe,
          wantCount: (this.data.recipe.wantCount || 0) + 1
        }
      })
      wx.showToast({ title: '已告诉作者', icon: 'success' })
    } catch (error) {
      this.setData({ submittingRequest: false })
      showError(error, '发起想吃失败')
    }
  },

  editRecipe() {
    wx.navigateTo({
      url: `/pages/recipe/edit/edit?id=${this.data.id}`
    })
  },

  previewCover() {
    const image = this.data.recipe && this.data.recipe.coverImage
    if (!image) return
    wx.previewImage({
      current: image,
      urls: [image]
    })
  },

  previewStepImage(e) {
    const image = e.currentTarget.dataset.image
    const urls = this.data.recipe.steps.map(item => item.image).filter(Boolean)
    wx.previewImage({
      current: image,
      urls
    })
  },

  goHome() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  },

  noop() {
    return false
  }
})
