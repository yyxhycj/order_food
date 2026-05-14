const recipeService = require('../../../services/recipe-service')
const favoriteService = require('../../../services/favorite-service')
const requestService = require('../../../services/request-service')
const userService = require('../../../services/user-service')
const commentService = require('../../../services/comment-service')
const { showError } = require('../../../utils/error')
const { validateRequestReason } = require('../../../utils/validator')

Page({
  data: {
    id: '',
    recipe: null,
    currentUser: null,
    loading: true,
    isFavorite: false,
    togglingFavorite: false,
    isOwner: false,
    isAdmin: false,
    comments: [],
    commentText: '',
    submittingComment: false,
    deletingCommentId: '',
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
      const [isFavorite, comments] = await Promise.all([
        user ? favoriteService.isFavorite(this.data.id).catch(() => false) : false,
        commentService.getComments(this.data.id).catch(() => [])
      ])
      const isAdmin = userService.isAdmin(user)

      this.setData({
        recipe,
        currentUser: user,
        isFavorite,
        comments,
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
    if (this.data.togglingFavorite) return
    this.setData({ togglingFavorite: true })

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
    } finally {
      this.setData({ togglingFavorite: false })
    }
  },

  openRequestModal() {
    if (this.data.isOwner) {
      wx.showToast({ title: '不能对自己的菜谱发起想吃', icon: 'none' })
      return
    }

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
    if (this.data.submittingRequest) return

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

  onCommentInput(e) {
    this.setData({
      commentText: e.detail.value
    })
  },

  async submitComment() {
    const content = (this.data.commentText || '').trim()

    if (!content) {
      wx.showToast({ title: '请输入留言内容', icon: 'none' })
      return
    }

    if (content.length > 200) {
      wx.showToast({ title: '留言最多 200 个字', icon: 'none' })
      return
    }

    this.setData({ submittingComment: true })

    try {
      const comment = await commentService.createComment(this.data.id, content)
      this.setData({
        commentText: '',
        comments: this.data.comments.concat(comment),
        recipe: {
          ...this.data.recipe,
          commentCount: (this.data.recipe.commentCount || 0) + 1
        }
      })
      wx.showToast({ title: '已留言', icon: 'success' })
    } catch (error) {
      showError(error, '留言失败')
    } finally {
      this.setData({ submittingComment: false })
    }
  },

  deleteComment(e) {
    const id = e.currentTarget.dataset.id
    if (!id || this.data.deletingCommentId) return

    wx.showModal({
      title: '删除留言',
      content: '确定删除这条留言吗？',
      success: async res => {
        if (!res.confirm) return

        this.setData({ deletingCommentId: id })

        try {
          await commentService.deleteComment(id)
          this.setData({
            comments: this.data.comments.filter(item => item._id !== id),
            recipe: {
              ...this.data.recipe,
              commentCount: Math.max((this.data.recipe.commentCount || 0) - 1, 0)
            }
          })
          wx.showToast({ title: '已删除', icon: 'success' })
        } catch (error) {
          showError(error, '删除留言失败')
        } finally {
          this.setData({ deletingCommentId: '' })
        }
      }
    })
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
