// pages/recipes/recommend/recommend.js
const app = getApp();
const API_BASE = app.globalData.apiBase || 'http://localhost:3000/api';

Page({
  data: {
    loading: true,
    isEmptyState: false,
    
    // 推荐概览数据
    recommendationSummary: null,
    
    // 推荐菜谱数据
    personalizedRecipes: [],
    similarTasteRecipes: [],
    trendingRecipes: [],
    
    // 设置选项
    frequencyOptions: ['每日更新', '每周更新', '手动刷新'],
    selectedFrequency: 0,
    
    // 用户信息
    userId: null
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '个性化推荐'
    });
    
    this.initUserInfo();
    this.loadRecommendations();
  },

  onShow() {
    // 页面显示时检查是否需要刷新推荐
    this.checkAndRefreshRecommendations();
  },

  onPullDownRefresh() {
    this.loadRecommendations();
    wx.stopPullDownRefresh();
  },

  // 初始化用户信息
  initUserInfo() {
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.id) {
      this.setData({
        userId: userInfo.id
      });
    } else {
      // 如果没有用户信息，跳转到登录页
      wx.showModal({
        title: '提示',
        content: '请先登录以获取个性化推荐',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  // 加载推荐数据
  async loadRecommendations() {
    if (!this.data.userId) {
      return;
    }

    this.setData({ loading: true });

    try {
      // 并行请求多个推荐API
      const [summaryRes, personalizedRes, similarRes, trendingRes] = await Promise.all([
        this.getRecommendationSummary(),
        this.getPersonalizedRecommendations(),
        this.getSimilarTasteRecommendations(),
        this.getTrendingRecommendations()
      ]);

      // 处理推荐概览数据
      let recommendationSummary = null;
      if (summaryRes && summaryRes.data && summaryRes.data.success) {
        recommendationSummary = summaryRes.data.data;
      }

      // 处理个性化推荐数据
      let personalizedRecipes = [];
      if (personalizedRes && personalizedRes.data && personalizedRes.data.success) {
        personalizedRecipes = this.processRecipeData(personalizedRes.data.data);
      }

      // 处理相似口味推荐数据
      let similarTasteRecipes = [];
      if (similarRes && similarRes.data && similarRes.data.success) {
        similarTasteRecipes = this.processRecipeData(similarRes.data.data);
      }

      // 处理热门推荐数据
      let trendingRecipes = [];
      if (trendingRes && trendingRes.data && trendingRes.data.success) {
        trendingRecipes = this.processRecipeData(trendingRes.data.data);
      }

      // 检查是否为空状态
      const isEmptyState = personalizedRecipes.length === 0 && 
                          similarTasteRecipes.length === 0 && 
                          trendingRecipes.length === 0;

      this.setData({
        loading: false,
        isEmptyState,
        recommendationSummary,
        personalizedRecipes,
        similarTasteRecipes,
        trendingRecipes
      });

    } catch (error) {
      console.error('加载推荐数据失败:', error);
      this.setData({
        loading: false,
        isEmptyState: true
      });
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 获取推荐概览
  getRecommendationSummary() {
    return wx.request({
      url: `${API_BASE}/recipes/recommendation-summary`,
      method: 'GET',
      data: { user_id: this.data.userId }
    });
  },

  // 获取个性化推荐
  getPersonalizedRecommendations() {
    return wx.request({
      url: `${API_BASE}/recipes/recommended`,
      method: 'GET',
      data: { 
        user_id: this.data.userId,
        limit: 10
      }
    });
  },

  // 获取相似口味推荐
  getSimilarTasteRecommendations() {
    return wx.request({
      url: `${API_BASE}/recipes/similar-taste`,
      method: 'GET',
      data: { 
        user_id: this.data.userId,
        limit: 10
      }
    });
  },

  // 获取热门推荐
  getTrendingRecommendations() {
    return wx.request({
      url: `${API_BASE}/recipes/trending`,
      method: 'GET',
      data: { limit: 10 }
    });
  },

  // 处理菜谱数据
  processRecipeData(recipes) {
    return recipes.map(recipe => ({
      ...recipe,
      difficulty_text: this.getDifficultyText(recipe.difficulty),
      average_rating: Number(recipe.average_rating).toFixed(1),
      recommend_reason: this.generateRecommendReason(recipe),
      similarity_score: recipe.similarity_score ? Math.round(recipe.similarity_score * 100) : null
    }));
  },

  // 获取难度文本
  getDifficultyText(difficulty) {
    const difficultyMap = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    };
    return difficultyMap[difficulty] || '中等';
  },

  // 生成推荐理由
  generateRecommendReason(recipe) {
    const reasons = [
      '符合您的口味偏好',
      '适合您的烹饪水平',
      '营养搭配合理',
      '制作时间适中',
      '食材容易获得'
    ];
    
    // 根据菜谱属性生成合适的推荐理由
    if (recipe.cooking_time <= 30) {
      return '制作快速简单';
    } else if (recipe.difficulty === 'easy') {
      return '操作简单易学';
    } else if (recipe.average_rating >= 4.5) {
      return '口碑极佳';
    } else if (recipe.nutrition_score && recipe.nutrition_score >= 8) {
      return '营养丰富健康';
    }
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  },

  // 检查并刷新推荐
  checkAndRefreshRecommendations() {
    const lastUpdateTime = wx.getStorageSync('lastRecommendationUpdate');
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // 如果超过一天没有更新，自动刷新
    if (!lastUpdateTime || (now - lastUpdateTime > oneDayMs)) {
      this.loadRecommendations();
      wx.setStorageSync('lastRecommendationUpdate', now);
    }
  },

  // 点击菜谱
  onRecipeClick(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: `/pages/recipes/detail/detail?id=${id}`
      });
    }
  },

  // 点击口味档案
  onTasteProfileClick() {
    wx.navigateTo({
      url: `/pages/user/taste-profile/taste-profile?userId=${this.data.userId}`
    });
  },

  // 点击标签管理
  onTagsClick() {
    wx.navigateTo({
      url: `/pages/user/tags/tags`
    });
  },

  // 改变推荐频率
  onFrequencyChange(e) {
    const selectedFrequency = parseInt(e.detail.value);
    this.setData({
      selectedFrequency
    });
    
    // 保存设置到本地存储
    wx.setStorageSync('recommendationFrequency', selectedFrequency);
  },

  // 刷新推荐
  onRefresh() {
    wx.showLoading({
      title: '正在刷新...'
    });
    
    this.loadRecommendations().then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    });
  },

  // 生成实时推荐
  async generateRealtimeRecommendations() {
    if (!this.data.userId) return;

    try {
      const context = {
        current_time: new Date().toISOString(),
        user_location: null, // 可以获取用户位置
        browse_history: this.getBrowseHistory(),
        search_keywords: this.getSearchKeywords()
      };

      const res = await wx.request({
        url: `${API_BASE}/recipes/realtime-recommendations`,
        method: 'POST',
        data: {
          user_id: this.data.userId,
          context
        }
      });

      if (res.data && res.data.success) {
        const realtimeRecipes = this.processRecipeData(res.data.data);
        
        // 更新推荐数据
        this.setData({
          personalizedRecipes: realtimeRecipes
        });
      }
    } catch (error) {
      console.error('生成实时推荐失败:', error);
    }
  },

  // 获取浏览历史
  getBrowseHistory() {
    return wx.getStorageSync('browseHistory') || [];
  },

  // 获取搜索关键词
  getSearchKeywords() {
    return wx.getStorageSync('searchKeywords') || [];
  },

  // 保存浏览历史
  saveBrowseHistory(recipeId) {
    let history = this.getBrowseHistory();
    history.unshift(recipeId);
    
    // 限制历史记录数量
    if (history.length > 100) {
      history = history.slice(0, 100);
    }
    
    wx.setStorageSync('browseHistory', history);
  },

  // 分享推荐
  onShareAppMessage() {
    return {
      title: '发现好菜谱，一起来看看吧！',
      path: '/pages/recipes/recommend/recommend'
    };
  }
}); 