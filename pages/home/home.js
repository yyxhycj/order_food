const recipeService = require('../../services/recipe-service')
const { showError } = require('../../utils/error')

Page({
  data: {
    keyword: '',
    currentCategoryId: 'all',
    sortBy: 'latest',
    sortOptions: [
      { value: 'latest', label: '新上的' },
      { value: 'popular', label: '大家想吃' },
      { value: 'favorite', label: '常留着' }
    ],
    categories: [{ _id: 'all', name: '全部' }],
    recipes: [],
    featuredRecipe: null,
    menuRecipes: [],
    menuSummary: '先把家里常吃的菜放进来',
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
    this.loadRecipes(true, true).finally(() => {
      wx.stopPullDownRefresh()
      this.setData({ refreshing: false })
    })
  },

  async loadInitialData() {
    const cachedCategories = recipeService.getCachedCategories()
    const cachedRecipes = recipeService.getCachedRecipeList(this.getRecipeOptions({ page: 0 }))

    if (cachedRecipes) {
      this.applyRecipes(cachedRecipes, true)
    }

    this.setData({
      categories: [{ _id: 'all', name: '全部' }].concat(cachedCategories.filter(item => item._id !== 'all')),
      loading: !cachedRecipes
    })

    try {
      const results = await Promise.all([
        recipeService.getCategories(),
        this.loadRecipes(true)
      ])
      const categories = results[0] || []
      this.setData({
        categories: [{ _id: 'all', name: '全部' }].concat(categories)
      })
    } catch (error) {
      showError(error, '打开菜单失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadRecipes(reset = false, forceRefresh = false) {
    if (!reset && this.data.loadingMore) return

    const page = reset ? 0 : this.data.page
    if (!reset) this.setData({ loadingMore: true })

    try {
      const recipes = await recipeService.getRecipeList(this.getRecipeOptions({ page, forceRefresh }))
      this.applyRecipes(recipes, reset, page)
    } finally {
      if (!reset) this.setData({ loadingMore: false })
    }
  },

  getRecipeOptions(extra = {}) {
    const options = {
      keyword: this.data.keyword,
      categoryId: this.data.currentCategoryId,
      sortBy: this.data.sortBy,
      limit: 20
    }
    Object.keys(extra || {}).forEach(key => {
      options[key] = extra[key]
    })
    return options
  },

  applyRecipes(recipes, reset, page = 0) {
    const nextRecipes = reset
      ? this.decorateRecipes(recipes)
      : this.data.recipes.concat(this.decorateRecipes(recipes))

    this.setData({
      recipes: nextRecipes,
      featuredRecipe: nextRecipes[0] || null,
      menuRecipes: nextRecipes.slice(1),
      menuSummary: nextRecipes.length ? `菜单里有 ${nextRecipes.length} 道菜` : '先把家里常吃的菜放进来',
      page: page + 1,
      hasMore: recipes.length === 20
    })
  },

  decorateRecipes(recipes) {
    return (recipes || []).map(recipe => {
      const tags = Array.isArray(recipe.tags) ? recipe.tags.slice(0, 2) : []
      const timeText = recipe.cookingTime ? `${recipe.cookingTime} 分钟` : '看心情'
      const difficultyText = recipe.difficultyText || '家常'
      const wantText = recipe.wantCount ? `${recipe.wantCount} 次想吃` : '还没人点'

      return Object.assign({}, recipe, {
        menuTags: tags.length ? tags : [difficultyText],
        menuLine: `${timeText} · ${difficultyText}`,
        featureLine: `${recipe.updatedAtText || recipe.createdAtText || '最近'} · ${wantText}`
      })
    })
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

  showAllRecipes() {
    this.setData({
      keyword: '',
      currentCategoryId: 'all',
      sortBy: 'latest',
      loading: true
    })
    this.loadRecipes(true, true)
      .catch(error => showError(error, '打开全部菜失败'))
      .finally(() => this.setData({ loading: false }))
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
    const id = e.detail && e.detail.id ? e.detail.id : e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/recipe/detail/detail?id=${id}`
    })
  },

  goToCreate() {
    wx.navigateTo({
      url: '/pages/recipe/edit/edit'
    })
  },

  goToPlan() {
    wx.switchTab({
      url: '/pages/plan/plan'
    })
  }
})
