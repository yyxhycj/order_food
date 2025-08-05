// pages/plans/list/list.js
Page({
  data: {
    planList: [],
    trendingPlans: [],
    recommendedPlans: [],
    searchText: '',
    difficultyOptions: [
      { value: '', text: '全部难度' },
      { value: 'easy', text: '简单' },
      { value: 'medium', text: '中等' },
      { value: 'hard', text: '困难' }
    ],
    difficultyIndex: 0,
    sortOptions: [
      { value: 'created_at', text: '最新发布' },
      { value: 'follower_count', text: '最多跟随' },
      { value: 'completion_rate', text: '完成率' },
      { value: 'average_rating', text: '评分最高' }
    ],
    sortIndex: 0,
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    refreshing: false
  },

  onLoad() {
    this.loadInitialData();
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshData();
  },

  onPullDownRefresh() {
    this.refreshData();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  // 加载初始数据
  async loadInitialData() {
    this.setData({ loading: true });
    
    try {
      // 并行加载数据
      const [trendingRes, recommendedRes, planRes] = await Promise.all([
        this.getTrendingPlans(),
        this.getRecommendedPlans(),
        this.getPlanList(1)
      ]);

      this.setData({
        trendingPlans: trendingRes.data || [],
        recommendedPlans: recommendedRes.data || [],
        planList: planRes.data || [],
        hasMore: planRes.data?.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 刷新数据
  async refreshData() {
    this.setData({ 
      refreshing: true,
      currentPage: 1
    });
    
    try {
      const [trendingRes, recommendedRes, planRes] = await Promise.all([
        this.getTrendingPlans(),
        this.getRecommendedPlans(),
        this.getPlanList(1)
      ]);

      this.setData({
        trendingPlans: trendingRes.data || [],
        recommendedPlans: recommendedRes.data || [],
        planList: planRes.data || [],
        hasMore: planRes.data?.length >= this.data.pageSize,
        refreshing: false
      });
      
      wx.stopPullDownRefresh();
    } catch (error) {
      console.error('刷新数据失败:', error);
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
    }
  },

  // 获取热门计划
  async getTrendingPlans() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://localhost:3000/api/recipe-plans/trending',
        method: 'GET',
        data: { limit: 5 },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '获取热门计划失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 获取推荐计划
  async getRecommendedPlans() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://localhost:3000/api/recipe-plans/recommended',
        method: 'GET',
        data: { limit: 3 },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '获取推荐计划失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 获取计划列表
  async getPlanList(page = 1) {
    const { searchText, difficultyOptions, difficultyIndex, sortOptions, sortIndex } = this.data;
    
    return new Promise((resolve, reject) => {
      const params = {
        page,
        limit: this.data.pageSize,
        sort_by: sortOptions[sortIndex].value,
        sort_order: 'DESC'
      };

      if (searchText) {
        params.search = searchText;
      }

      if (difficultyIndex > 0) {
        params.difficulty_level = difficultyOptions[difficultyIndex].value;
      }

      wx.request({
        url: 'http://localhost:3000/api/recipe-plans',
        method: 'GET',
        data: params,
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '获取计划列表失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 加载更多
  async loadMore() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });
    const nextPage = this.data.currentPage + 1;

    try {
      const res = await this.getPlanList(nextPage);
      const newPlans = res.data || [];
      
      this.setData({
        planList: [...this.data.planList, ...newPlans],
        currentPage: nextPage,
        hasMore: newPlans.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      console.error('加载更多失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchText: e.detail.value });
    
    // 防抖搜索
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 500);
  },

  // 执行搜索
  async performSearch() {
    this.setData({ 
      currentPage: 1,
      loading: true 
    });

    try {
      const res = await this.getPlanList(1);
      this.setData({
        planList: res.data || [],
        hasMore: res.data?.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      });
    }
  },

  // 难度筛选
  async onDifficultyChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ 
      difficultyIndex: index,
      currentPage: 1,
      loading: true 
    });

    try {
      const res = await this.getPlanList(1);
      this.setData({
        planList: res.data || [],
        hasMore: res.data?.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      console.error('筛选失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '筛选失败',
        icon: 'none'
      });
    }
  },

  // 排序选择
  async onSortChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ 
      sortIndex: index,
      currentPage: 1,
      loading: true 
    });

    try {
      const res = await this.getPlanList(1);
      this.setData({
        planList: res.data || [],
        hasMore: res.data?.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      console.error('排序失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '排序失败',
        icon: 'none'
      });
    }
  },

  // 查看计划详情
  viewPlan(e) {
    const planId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/plans/detail/detail?id=${planId}`
    });
  },

  // 查看全部热门计划
  showAllTrending() {
    // 设置筛选为热门排序
    this.setData({ sortIndex: 1 });
    this.onSortChange({ detail: { value: 1 } });
  },

  // 创建计划
  createPlan() {
    wx.navigateTo({
      url: '/pages/plans/create/create'
    });
  },

  // 格式化时间
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  }
}); 