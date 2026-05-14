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
      const [recipes, requests, categories] = await Promise.all([
        isAdmin
          ? recipeService.getRecipeList({ includeHidden: true, limit: 100 })
          : recipeService.getRecipeList({ authorOpenid: user.openid, includeHidden: true, limit: 100 }),
        isAdmin ? requestService.getAllRequests() : requestService.getReceivedRequests(),
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
