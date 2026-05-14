const recipeService = require('../../services/recipe-service')
const { showError } = require('../../utils/error')

Page({
  data: {
    keyword: '',
    currentCategoryId: 'all',
    sortBy: 'latest',
    sortOptions: [
      { value: 'latest', label: '最新' },
      { value: 'popular', label: '想吃多' },
      { value: 'favorite', label: '收藏多' }
    ],
    categories: [{ _id: 'all', name: '全部' }],
    recipes: [],
    loading: true,
    loadingMore: false,
    refreshing: false,
    page: 0,
    hasMore: true
  },

  onLoad() {
    this.loadInitialData()
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadRecipes(true).finally(() => {
      wx.stopPullDownRefresh()
      this.setData({ refreshing: false })
    })
  },

  async loadInitialData() {
    this.setData({ loading: true })
    try {
      const categories = await recipeService.getCategories()
      this.setData({
        categories: [{ _id: 'all', name: '全部' }].concat(categories)
      })
      await this.loadRecipes(true)
    } catch (error) {
      showError(error, '加载菜谱失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadRecipes(reset = false) {
    if (!reset && this.data.loadingMore) return

    const page = reset ? 0 : this.data.page
    if (!reset) this.setData({ loadingMore: true })

    try {
      const recipes = await recipeService.getRecipeList({
        keyword: this.data.keyword,
        categoryId: this.data.currentCategoryId,
        sortBy: this.data.sortBy,
        page,
        limit: 20
      })

      this.setData({
        recipes: reset ? recipes : this.data.recipes.concat(recipes),
        page: page + 1,
        hasMore: recipes.length === 20
      })
    } finally {
      if (!reset) this.setData({ loadingMore: false })
    }
  },

  onReachBottom() {
    if (this.data.loading || this.data.loadingMore || !this.data.hasMore) return
    this.loadRecipes(false).catch(error => showError(error, '加载更多失败'))
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.setData({ loading: true })
    this.loadRecipes(true)
      .catch(error => showError(error, '搜索失败'))
      .finally(() => this.setData({ loading: false }))
  },

  clearSearch() {
    this.setData({ keyword: '' })
    this.onSearch()
  },

  selectCategory(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      currentCategoryId: id,
      loading: true
    })
    this.loadRecipes(true)
      .catch(error => showError(error, '筛选失败'))
      .finally(() => this.setData({ loading: false }))
  },

  selectSort(e) {
    const sortBy = e.currentTarget.dataset.sort
    this.setData({
      sortBy,
      loading: true
    })
    this.loadRecipes(true)
      .catch(error => showError(error, '排序失败'))
      .finally(() => this.setData({ loading: false }))
  },

  goToRecipe(e) {
    const id = e.detail.id
    wx.navigateTo({
      url: `/pages/recipe/detail/detail?id=${id}`
    })
  },

  goToCreate() {
    wx.navigateTo({
      url: '/pages/recipe/edit/edit'
    })
  }
})
