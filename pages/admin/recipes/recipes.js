const recipeService = require('../../../services/recipe-service')
const favoriteService = require('../../../services/favorite-service')
const userService = require('../../../services/user-service')
const { RECIPE_STATUS, getRecipeStatusText } = require('../../../constants/recipe-status')
const { showError } = require('../../../utils/error')

Page({
  data: {
    scope: 'admin',
    title: '菜单管理',
    recipes: [],
    loading: true,
    isAdmin: false
  },

  onLoad(options) {
    const scope = options.scope || 'admin'
    const titleMap = {
      admin: '菜单管理',
      mine: '我会做的',
      favorites: '留着下次吃'
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
          authorUserId: user._id,
          limit: 100,
          forceRefresh: true
        })
      } else if (this.data.scope === 'favorites') {
        const favorites = await favoriteService.getFavorites()
        const ids = favorites.map(item => item.recipeId)
        recipes = ids.length
          ? await recipeService.getRecipeList({ ids, limit: 100, forceRefresh: true })
          : []
        const orderMap = favorites.reduce((map, item, index) => {
          map[item.recipeId] = index
          return map
        }, {})
        recipes = recipes.sort((a, b) => (orderMap[a._id] || 0) - (orderMap[b._id] || 0))
      } else {
        if (!isAdmin) {
          wx.showToast({ title: '仅管理员可进入', icon: 'none' })
          setTimeout(() => wx.navigateBack(), 600)
          return
        }

        recipes = await recipeService.getRecipeList({
          includeHidden: true,
          limit: 100,
          forceRefresh: true
        })
      }

      this.setData({
        isAdmin,
        recipes: recipes.map(item => Object.assign({}, item, {
          statusText: getRecipeStatusText(item.status)
        }))
      })
    } catch (error) {
      showError(error, '加载菜单失败')
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
      title: '删掉这道菜？',
      content: '删掉后不会出现在菜单里，确定继续吗？',
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
  },

  onEmptyAction() {
    if (this.data.scope === 'favorites') {
      wx.switchTab({
        url: '/pages/home/home'
      })
      return
    }

    this.createRecipe()
  }
})
