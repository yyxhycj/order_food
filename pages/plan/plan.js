const requestService = require('../../services/request-service')
const recipeService = require('../../services/recipe-service')
const { REQUEST_STATUS } = require('../../constants/request-status')
const { showError } = require('../../utils/error')

const ASSIGNEE_STORAGE_KEY = 'familyMenuAssignees'
const ASSIGNEE_TEXT = {
  me: '我',
  partner: '你',
  together: '一起',
  later: '先放着'
}
const SELECTED_DATE_KEY = 'familyMenuSelectedDate'
const SAVED_PLAN_KEY = 'familyMenuSavedPlan'

function getDateText(offset = 0) {
  const today = new Date()
  const date = new Date(today)
  date.setDate(today.getDate() + Number(offset || 0))
  const dateWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日 · ${dateWeek}`
}

function buildDateStrip(activeOffset = 0) {
  const today = new Date()
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  return [-2, -1, 0, 1, 2].map(offset => {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    return {
      key: offset,
      day: date.getDate(),
      week: offset === 0 ? '今天' : week[date.getDay()],
      active: offset === Number(activeOffset || 0)
    }
  })
}

function loadAssignees() {
  try {
    return wx.getStorageSync(ASSIGNEE_STORAGE_KEY) || {}
  } catch (error) {
    return {}
  }
}

function saveAssignees(assignees) {
  wx.setStorageSync(ASSIGNEE_STORAGE_KEY, assignees || {})
}

function keepUsefulRequest(request) {
  return [
    REQUEST_STATUS.PENDING,
    REQUEST_STATUS.ACCEPTED,
    REQUEST_STATUS.PREPARING
  ].indexOf(request.status) >= 0
}

function makeDishFromRequest(request, source, index, assignees) {
  const id = `request-${request._id}`
  const assignee = assignees[id] || (index === 0 ? 'together' : index === 1 ? 'me' : 'later')

  return {
    id,
    requestId: request._id,
    recipeId: request.recipeId,
    title: request.recipeTitle,
    coverImage: request.recipeCoverImage || '/images/dish-placeholder.png',
    subtitle: source,
    status: request.status === REQUEST_STATUS.PENDING ? '待定' : '已定',
    statusClass: request.status === REQUEST_STATUS.PENDING ? 'wait' : 'ready',
    assignee,
    assigneeText: ASSIGNEE_TEXT[assignee]
  }
}

function makeDishFromRecipe(recipe, index, assignees) {
  const id = `recipe-${recipe._id}`
  const assignee = assignees[id] || (index === 0 ? 'together' : 'later')

  return {
    id,
    recipeId: recipe._id,
    title: recipe.title,
    coverImage: recipe.coverImage || '/images/dish-placeholder.png',
    subtitle: recipe.cookingTime ? `${recipe.cookingTime} 分钟 · 菜单里挑的` : '菜单里挑的',
    status: '备选',
    statusClass: 'wait',
    assignee,
    assigneeText: ASSIGNEE_TEXT[assignee]
  }
}

Page({
  data: {
    loading: true,
    selectedDateOffset: Number(wx.getStorageSync(SELECTED_DATE_KEY) || 0),
    todayText: getDateText(Number(wx.getStorageSync(SELECTED_DATE_KEY) || 0)),
    dates: buildDateStrip(Number(wx.getStorageSync(SELECTED_DATE_KEY) || 0)),
    dishes: [],
    plannedCount: 0,
    totalMinutes: 0,
    assigneeOptions: [
      { value: 'me', label: '我来做' },
      { value: 'partner', label: '你来做' },
      { value: 'together', label: '一起弄' },
      { value: 'later', label: '先放着' }
    ],
    shoppingList: []
  },

  onShow() {
    this.loadPlan()
  },

  onPullDownRefresh() {
    this.loadPlan().finally(() => wx.stopPullDownRefresh())
  },

  async loadPlan() {
    const assignees = loadAssignees()
    const cachedMyRequests = requestService.getCachedRequests('mine') || []
    const cachedReceivedRequests = requestService.getCachedRequests('received') || []
    const cachedRecipes = recipeService.getCachedRecipeList({ sortBy: 'popular', page: 0, limit: 6 }) || []

    if (cachedMyRequests.length || cachedReceivedRequests.length || cachedRecipes.length) {
      this.applyPlan(cachedMyRequests, cachedReceivedRequests, cachedRecipes, assignees)
      this.setData({ loading: false })
    } else {
      this.setData({ loading: true })
    }

    try {
      const results = await Promise.all([
        requestService.getMyRequests().catch(() => []),
        requestService.getReceivedRequests().catch(() => []),
        recipeService.getRecipeList({ sortBy: 'popular', page: 0, limit: 6 }).catch(() => [])
      ])
      const myRequests = results[0] || []
      const receivedRequests = results[1] || []
      const recipes = results[2] || []
      this.applyPlan(myRequests, receivedRequests, recipes, assignees)
      this.setData({ loading: false })
    } catch (error) {
      showError(error, '今天吃什么加载失败')
      this.setData({ loading: false })
    }
  },

  applyPlan(myRequests, receivedRequests, recipes, assignees) {
    const requestDishes = []
    myRequests.filter(keepUsefulRequest).slice(0, 2).forEach((request, index) => {
      requestDishes.push(makeDishFromRequest(request, '我想吃', index, assignees))
    })
    receivedRequests.filter(keepUsefulRequest).slice(0, 2).forEach((request, index) => {
      requestDishes.push(makeDishFromRequest(request, '有人想吃', requestDishes.length + index, assignees))
    })

    const fallbackDishes = recipes.slice(0, Math.max(0, 3 - requestDishes.length))
      .map((recipe, index) => makeDishFromRecipe(recipe, index, assignees))
    const dishes = requestDishes.concat(fallbackDishes).slice(0, 4)

    this.setData({
      todayText: getDateText(this.data.selectedDateOffset),
      dates: buildDateStrip(this.data.selectedDateOffset),
      dishes,
      plannedCount: dishes.filter(item => item.assignee !== 'later').length,
      totalMinutes: dishes.length * 20 + 15,
      shoppingList: this.buildShoppingList(dishes)
    })
  },

  selectDate(e) {
    const offset = Number(e.currentTarget.dataset.key || 0)
    wx.setStorageSync(SELECTED_DATE_KEY, offset)
    this.setData({
      selectedDateOffset: offset,
      todayText: getDateText(offset),
      dates: buildDateStrip(offset)
    })
  },

  buildShoppingList(dishes) {
    if (!dishes.length) return []

    const names = dishes.slice(0, 3).map(item => item.title)
    return [
      { id: 'main', text: names.join('、') },
      { id: 'fresh', text: '看看家里还缺不缺青菜' },
      { id: 'seasoning', text: '葱姜蒜顺手补一点' }
    ]
  },

  selectAssignee(e) {
    const id = e.currentTarget.dataset.id
    const assignee = e.currentTarget.dataset.assignee
    if (!id || !assignee) return

    const assignees = loadAssignees()
    assignees[id] = assignee
    saveAssignees(assignees)

    const dishes = this.data.dishes.map(item => {
      if (item.id !== id) return item
      return Object.assign({}, item, {
        assignee,
        assigneeText: ASSIGNEE_TEXT[assignee]
      })
    })

    this.setData({
      dishes,
      plannedCount: dishes.filter(item => item.assignee !== 'later').length
    })
  },

  openDish(e) {
    const recipeId = e.currentTarget.dataset.recipeId
    if (!recipeId) return

    wx.navigateTo({
      url: `/pages/recipe/detail/detail?id=${recipeId}`
    })
  },

  goHome() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  },

  saveTodayPlan() {
    wx.setStorageSync(SAVED_PLAN_KEY, {
      dateOffset: this.data.selectedDateOffset,
      savedAt: Date.now(),
      dishes: this.data.dishes.map(item => ({
        id: item.id,
        recipeId: item.recipeId,
        title: item.title,
        assignee: item.assignee,
        assigneeText: item.assigneeText
      }))
    })
    wx.showToast({
      title: '先这么吃',
      icon: 'success'
    })
  },

  noop() {
    return false
  }
})
