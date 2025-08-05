// pages/recipes/list/list.js
const app = getApp();
const API_BASE = app.globalData.apiBase || 'http://localhost:3000/api';

Page({
  data: {
    recipes: [],
    searchKeyword: '',
    difficultyIndex: 0,
    difficultyOptions: ['全部', '简单', '中等', '困难'],
    categoryIndex: 0,
    categoryOptions: [{ name: '全部' }],
    sortBy: 'created_at',
    sortOrder: 'DESC',
    page: 1,
    limit: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadCategories();
    this.loadRecipes();
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshRecipes();
  },

  onPullDownRefresh() {
    this.refreshRecipes();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreRecipes();
    }
  },

  // 加载分类数据
  loadCategories() {
    wx.request({
      url: `${API_BASE}/categories`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          this.setData({
            categoryOptions: [{ name: '全部' }, ...res.data.data]
          });
        }
      },
      fail: (error) => {
        console.error('加载分类失败:', error);
        wx.showToast({
          title: '加载分类失败',
          icon: 'none'
        });
      }
    });
  },

  // 加载菜谱数据
  loadRecipes(reset = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });

    const params = {
      page: reset ? 1 : this.data.page,
      limit: this.data.limit,
      sort_by: this.data.sortBy,
      sort_order: this.data.sortOrder
    };

    // 添加筛选条件
    if (this.data.searchKeyword) {
      params.search = this.data.searchKeyword;
    }

    if (this.data.difficultyIndex > 0) {
      const difficultyMap = ['', 'easy', 'medium', 'hard'];
      params.difficulty = difficultyMap[this.data.difficultyIndex];
    }

    if (this.data.categoryIndex > 0) {
      params.category_id = this.data.categoryOptions[this.data.categoryIndex].id;
    }

    wx.request({
      url: `${API_BASE}/recipes`,
      method: 'GET',
      data: params,
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const newRecipes = res.data.data;
          const recipes = reset ? newRecipes : [...this.data.recipes, ...newRecipes];
          
          this.setData({
            recipes,
            page: reset ? 2 : this.data.page + 1,
            hasMore: newRecipes.length === this.data.limit,
            loading: false
          });
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          });
          this.setData({ loading: false });
        }
      },
      fail: (error) => {
        console.error('加载菜谱失败:', error);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        this.setData({ loading: false });
      },
      complete: () => {
        wx.stopPullDownRefresh();
      }
    });
  },

  // 刷新菜谱
  refreshRecipes() {
    this.setData({ page: 1, hasMore: true });
    this.loadRecipes(true);
  },

  // 加载更多菜谱
  loadMoreRecipes() {
    this.loadRecipes(false);
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 执行搜索
  onSearch() {
    this.refreshRecipes();
  },

  // 难度筛选
  onDifficultyChange(e) {
    this.setData({
      difficultyIndex: parseInt(e.detail.value)
    });
    this.refreshRecipes();
  },

  // 分类筛选
  onCategoryChange(e) {
    this.setData({
      categoryIndex: parseInt(e.detail.value)
    });
    this.refreshRecipes();
  },

  // 排序方式
  onSortChange(e) {
    const sortBy = e.currentTarget.dataset.sort;
    this.setData({
      sortBy,
      sortOrder: 'DESC'
    });
    this.refreshRecipes();
  },

  // 点击菜谱
  onRecipeClick(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/recipes/detail/detail?id=${id}`
    });
  },

  // 创建菜谱
  onCreateRecipe() {
    wx.navigateTo({
      url: '/pages/recipes/create/create'
    });
  },

  // 智能生成菜谱
  onGenerateRecipe() {
    wx.navigateTo({
      url: '/pages/recipes/generator/generator'
    });
  },

  // 个性化推荐
  onRecommendRecipe() {
    wx.navigateTo({
      url: '/pages/recipes/recommend/recommend'
    });
  },

  // 加载更多按钮
  onLoadMore() {
    this.loadMoreRecipes();
  }
}); 