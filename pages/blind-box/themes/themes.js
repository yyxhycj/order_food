// pages/blind-box/themes/themes.js
const app = getApp()
const util = require('../../../utils/util')

Page({
  data: {
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
    showPreview: false,
    previewData: null,
    generating: false,
    loading: false,
    loadingText: '加载中...'
  },

  onLoad(options) {
    this.loadThemes()
    this.loadRecommendedSettings()
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
   * 预览盲盒
   */
  async previewBlindBox() {
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
    await this.generateBlindBox()
  },

  /**
   * 生成盲盒
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