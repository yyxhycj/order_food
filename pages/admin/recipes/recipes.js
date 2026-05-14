const recipeService = require('../../../services/recipe-service')
const favoriteService = require('../../../services/favorite-service')
const userService = require('../../../services/user-service')
const { RECIPE_STATUS, getRecipeStatusText } = require('../../../constants/recipe-status')
const { showError } = require('../../../utils/error')

Page({
  data: {
    scope: 'admin',
    title: '菜谱管理',
    recipes: [],
    loading: true,
    isAdmin: false
  },

  onLoad(options) {
    const scope = options.scope || 'admin'
    const titleMap = {
      admin: '菜谱管理',
      mine: '我的菜谱',
      favorites: '我的收藏'
    }
    this.setData({
      scope,
      title: titleMap[scope] || titleMap.admin
    })
    wx.setNavigationBarTitle({ title: this.data.title })
  },

  onShow() {
    this.loadRecipes()
  },

  async loadRecipes() {
    this.setData({ loading: true })

    try {
      const user = await userService.getCurrentUser()
      const isAdmin = userService.isAdmin(user)
      let recipes = []

      if (this.data.scope === 'mine') {
        recipes = await recipeService.getRecipeList({
          includeHidden: true,
          authorOpenid: user.openid,
          limit: 100
        })
      } else if (this.data.scope === 'favorites') {
        const favorites = await favoriteService.getFavorites()
        const ids = favorites.map(item => item.recipeId)
        recipes = ids.length
          ? await recipeService.getRecipeList({ ids, limit: 100 })
          : []
      } else {
        recipes = await recipeService.getRecipeList({
          includeHidden: true,
          limit: 100
        })
      }

      this.setData({
        isAdmin,
        recipes: recipes.map(item => ({
          ...item,
          statusText: getRecipeStatusText(item.status)
        }))
      })
    } catch (error) {
      showError(error, '加载菜谱失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goToRecipe(e) {
    wx.navigateTo({
      url: `/pages/recipe/detail/detail?id=${e.detail.id}`
    })
  },

  editRecipe(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/recipe/edit/edit?id=${id}`
    })
  },

  async publishRecipe(e) {
    try {
      await recipeService.publishRecipe(e.currentTarget.dataset.id)
      wx.showToast({ title: '已发布', icon: 'success' })
      this.loadRecipes()
    } catch (error) {
      showError(error, '发布失败')
    }
  },

  async hideRecipe(e) {
    try {
      await recipeService.hideRecipe(e.currentTarget.dataset.id)
      wx.showToast({ title: '已隐藏', icon: 'success' })
      this.loadRecipes()
    } catch (error) {
      showError(error, '隐藏失败')
    }
  },

  deleteRecipe(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除菜谱',
      content: '删除后不会在主列表展示，确定继续吗？',
      success: async res => {
        if (!res.confirm) return

        try {
          await recipeService.deleteRecipe(id)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadRecipes()
        } catch (error) {
          showError(error, '删除失败')
        }
      }
    })
  },

  createRecipe() {
    wx.navigateTo({
      url: '/pages/recipe/edit/edit'
    })
  }
})
