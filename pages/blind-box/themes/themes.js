// pages/blind-box/themes/themes.js
const app = getApp()
const util = require('../../../utils/util')

Page({
  data: {
    // 模式选择
    currentMode: 'recipe', // recipe: 菜谱模式, ingredient: 食材模式
    modes: [
      { value: 'recipe', label: '菜谱模式', desc: '基于主题和偏好随机推荐菜谱' },
      { value: 'ingredient', label: '食材模式', desc: '基于已有食材推荐相关菜谱' }
    ],
    
    // 菜谱模式数据
    themes: [],
    selectedTheme: null,
    recommendedTheme: null,
    boxSize: 5,
    dietaryRestrictions: ['素食', '无麸质', '无乳制品', '无坚果', '低糖', '低盐'],
    selectedRestrictions: [],
    budgetRanges: [
      { value: 'low', label: '经济实惠' },
      { value: 'medium', label: '中等价位' },
      { value: 'high', label: '品质优选' }
    ],
    selectedBudget: 'medium',
    
    // 食材模式数据
    availableIngredients: [],
    selectedIngredients: [],
    ingredientMatchMode: 'any', // any: 包含任一食材, all: 包含所有食材
    showIngredientPicker: false,
    
    // 通用数据
    showPreview: false,
    previewData: null,
    generating: false,
    loading: false,
    loadingText: '加载中...'
  },

  onLoad(options) {
    this.loadThemes()
    this.loadIngredients()
    this.loadRecommendedSettings()
  },

  /**
   * 切换模式
   */
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ 
      currentMode: mode,
      showPreview: false 
    })
  },

  /**
   * 加载食材列表
   */
  async loadIngredients() {
    try {
      const response = await util.request({
        url: '/api/blind-box/ingredients',
        method: 'GET'
      })
      
      if (response.success) {
        this.setData({
          availableIngredients: response.data
        })
      } else {
        console.error('加载食材列表失败:', response.message)
      }
    } catch (error) {
      console.error('加载食材列表失败:', error)
    }
  },

  /**
   * 显示食材选择器
   */
  showIngredientSelector() {
    this.setData({ showIngredientPicker: true })
  },

  /**
   * 隐藏食材选择器
   */
  hideIngredientSelector() {
    this.setData({ showIngredientPicker: false })
  },

  /**
   * 选择/取消选择食材
   */
  toggleIngredient(e) {
    const ingredient = e.currentTarget.dataset.ingredient
    let { selectedIngredients } = this.data
    
    const index = selectedIngredients.indexOf(ingredient)
    if (index > -1) {
      selectedIngredients.splice(index, 1)
    } else {
      selectedIngredients.push(ingredient)
    }
    
    this.setData({ selectedIngredients })
  },

  /**
   * 切换食材匹配模式
   */
  switchMatchMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ ingredientMatchMode: mode })
  },

  /**
   * 预览食材盲盒
   */
  async previewIngredientBlindBox() {
    if (this.data.selectedIngredients.length === 0) {
      wx.showToast({
        title: '请至少选择一种食材',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ loading: true, loadingText: '生成预览中...' })
      
      const userInfo = app.globalData.userInfo
      const requestData = {
        user_id: userInfo.id,
        ingredients: this.data.selectedIngredients,
        box_size: this.data.boxSize,
        match_mode: this.data.ingredientMatchMode
      }
      
      const response = await util.request({
        url: '/api/blind-box/preview/ingredient',
        method: 'POST',
        data: requestData
      })
      
      if (response.success) {
        this.setData({
          previewData: response.data,
          showPreview: true
        })
      } else {
        wx.showToast({
          title: response.message || '预览失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('预览食材盲盒失败:', error)
      wx.showToast({
        title: '预览失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 生成食材盲盒
   */
  async generateIngredientBlindBox() {
    if (this.data.selectedIngredients.length === 0) {
      wx.showToast({
        title: '请至少选择一种食材',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ generating: true, loading: true, loadingText: '正在生成你的专属盲盒...' })
      
      const userInfo = app.globalData.userInfo
      const requestData = {
        user_id: userInfo.id,
        ingredients: this.data.selectedIngredients,
        box_size: this.data.boxSize,
        match_mode: this.data.ingredientMatchMode
      }
      
      const response = await util.request({
        url: '/api/blind-box/generate/ingredient',
        method: 'POST',
        data: requestData
      })
      
      if (response.success) {
        wx.showToast({
          title: '食材盲盒生成成功！',
          icon: 'success'
        })
        
        // 跳转到盲盒详情页
        wx.navigateTo({
          url: `/pages/blind-box/detail/detail?boxId=${response.data.id}`
        })
      } else {
        wx.showToast({
          title: response.message || '生成失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('生成食材盲盒失败:', error)
      wx.showToast({
        title: '生成失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ generating: false, loading: false })
    }
  },

  /**
   * 加载盲盒主题列表
   */
  async loadThemes() {
    try {
      this.setData({ loading: true, loadingText: '加载主题列表...' })
      
      const response = await util.request({
        url: '/api/blind-box/themes',
        method: 'GET'
      })
      
      if (response.success) {
        this.setData({
          themes: response.data
        })
      } else {
        wx.showToast({
          title: response.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载主题列表失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 加载推荐设置
   */
  async loadRecommendedSettings() {
    try {
      const userInfo = app.globalData.userInfo
      if (!userInfo || !userInfo.id) return

      const response = await util.request({
        url: `/api/blind-box/user/${userInfo.id}/recommendations`,
        method: 'GET'
      })
      
      if (response.success) {
        const recommendations = response.data
        this.setData({
          recommendedTheme: recommendations.theme,
          selectedRestrictions: recommendations.dietary_restrictions || [],
          selectedBudget: recommendations.budget_range || 'medium',
          boxSize: recommendations.box_size || 5
        })
      }
    } catch (error) {
      console.error('加载推荐设置失败:', error)
    }
  },

  /**
   * 选择主题
   */
  selectTheme(e) {
    const theme = e.currentTarget.dataset.theme
    this.setData({ selectedTheme: theme })
    
    // 触觉反馈
    wx.vibrateShort()
  },

  /**
   * 改变盲盒数量
   */
  changeQuantity(e) {
    const action = e.currentTarget.dataset.action
    let { boxSize } = this.data
    
    if (action === 'increase' && boxSize < 10) {
      boxSize++
    } else if (action === 'decrease' && boxSize > 1) {
      boxSize--
    }
    
    this.setData({ boxSize })
  },

  /**
   * 切换饮食限制
   */
  toggleRestriction(e) {
    const restriction = e.currentTarget.dataset.restriction
    let { selectedRestrictions } = this.data
    
    const index = selectedRestrictions.indexOf(restriction)
    if (index > -1) {
      selectedRestrictions.splice(index, 1)
    } else {
      selectedRestrictions.push(restriction)
    }
    
    this.setData({ selectedRestrictions })
  },

  /**
   * 选择预算范围
   */
  selectBudget(e) {
    const budget = e.currentTarget.dataset.budget
    this.setData({ selectedBudget: budget })
  },

  /**
   * 预览盲盒（统一入口）
   */
  async previewBlindBox() {
    if (this.data.currentMode === 'ingredient') {
      return this.previewIngredientBlindBox()
    }
    
    if (!this.data.selectedTheme) {
      wx.showToast({
        title: '请先选择主题',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ loading: true, loadingText: '生成预览中...' })
      
      const userInfo = app.globalData.userInfo
      const requestData = {
        user_id: userInfo.id,
        theme: this.data.selectedTheme.id,
        dietary_restrictions: this.data.selectedRestrictions,
        budget_range: this.data.selectedBudget,
        box_size: this.data.boxSize
      }
      
      const response = await util.request({
        url: '/api/blind-box/preview',
        method: 'POST',
        data: requestData
      })
      
      if (response.success) {
        this.setData({
          previewData: response.data,
          showPreview: true
        })
      } else {
        wx.showToast({
          title: response.message || '预览失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('预览盲盒失败:', error)
      wx.showToast({
        title: '预览失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 关闭预览弹窗
   */
  closePreview() {
    this.setData({ showPreview: false })
  },

  /**
   * 确认生成盲盒
   */
  async confirmGenerate() {
    this.setData({ showPreview: false })
    
    if (this.data.currentMode === 'ingredient') {
      await this.generateIngredientBlindBox()
    } else {
      await this.generateBlindBox()
    }
  },

  /**
   * 生成盲盒（菜谱模式）
   */
  async generateBlindBox() {
    if (!this.data.selectedTheme) {
      wx.showToast({
        title: '请先选择主题',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ generating: true, loading: true, loadingText: '正在生成你的专属盲盒...' })
      
      const userInfo = app.globalData.userInfo
      const requestData = {
        user_id: userInfo.id,
        theme: this.data.selectedTheme.id,
        dietary_restrictions: this.data.selectedRestrictions,
        budget_range: this.data.selectedBudget,
        box_size: this.data.boxSize
      }
      
      const response = await util.request({
        url: '/api/blind-box/generate',
        method: 'POST',
        data: requestData
      })
      
      if (response.success) {
        wx.showToast({
          title: '盲盒生成成功！',
          icon: 'success'
        })
        
        // 跳转到盲盒详情页
        wx.navigateTo({
          url: `/pages/blind-box/detail/detail?boxId=${response.data.id}`
        })
      } else {
        wx.showToast({
          title: response.message || '生成失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('生成盲盒失败:', error)
      wx.showToast({
        title: '生成失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ generating: false, loading: false })
    }
  },

  /**
   * 分享功能
   */
  onShareAppMessage() {
    return {
      title: '来试试菜谱盲盒，发现意想不到的美味！',
      path: '/pages/blind-box/themes/themes',
      imageUrl: '/images/blind-box-share.jpg'
    }
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '菜谱盲盒 - 发现美味的惊喜',
      query: '',
      imageUrl: '/images/blind-box-share.jpg'
    }
  }
}) 