const userService = require('../../../services/user-service')
const recipeService = require('../../../services/recipe-service')
const requestService = require('../../../services/request-service')
const { showError } = require('../../../utils/error')

Page({
  data: {
    isAdmin: false,
    stats: {
      recipeCount: 0,
      requestCount: 0,
      categoryCount: 0
    },
    loading: true
  },

  onShow() {
    this.loadAdmin()
  },

  async loadAdmin() {
    this.setData({ loading: true })
    try {
      const user = await userService.getCurrentUser()
      const isAdmin = userService.isAdmin(user)

      if (!isAdmin) {
        this.setData({ isAdmin: false })
        wx.showToast({ title: '仅管理员可进入', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 600)
        return
      }

      const [recipes, requests, categories] = await Promise.all([
        recipeService.getRecipeList({ includeHidden: true, limit: 100 }),
        requestService.getAllRequests(),
        recipeService.getCategories()
      ])

      this.setData({
        isAdmin,
        stats: {
          recipeCount: recipes.length,
          requestCount: requests.length,
          categoryCount: categories.length
        }
      })
    } catch (error) {
      showError(error, '加载管理数据失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goCategories() {
    wx.navigateTo({
      url: '/pages/admin/categories/categories'
    })
  },

  goRecipes() {
    wx.navigateTo({
      url: '/pages/admin/recipes/recipes'
    })
  },

  goRequests() {
    wx.navigateTo({
      url: '/pages/requests/manage/manage'
    })
  }
})
