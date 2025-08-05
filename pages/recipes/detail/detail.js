Page({
  data: {
    recipe: {},
    ingredients: [],
    steps: [],
    nutritionData: [],
    reviews: [],
    relatedRecipes: [],
    ratingBreakdown: [],
    hasMoreReviews: false,
    reviewPage: 1,
    reviewPageSize: 10,
    difficultyMap: {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    }
  },

  onLoad: function(options) {
    const recipeId = options.id;
    if (recipeId) {
      this.setData({ recipeId });
      this.loadRecipeDetail(recipeId);
      this.loadRecipeReviews(recipeId);
      this.loadRelatedRecipes(recipeId);
      this.recordView(recipeId);
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载菜谱详情
  loadRecipeDetail: function(recipeId) {
    wx.showLoading({
      title: '加载中...'
    });

    wx.request({
      url: `http://localhost:3000/api/recipes/${recipeId}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          const recipe = res.data.data;
          this.setData({
            recipe: recipe,
            ingredients: this.parseIngredients(recipe.ingredients),
            steps: this.parseSteps(recipe.steps),
            nutritionData: this.parseNutritionInfo(recipe.nutrition_info)
          });
          
          // 更新导航栏标题
          wx.setNavigationBarTitle({
            title: recipe.name
          });
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('加载菜谱详情失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 加载菜谱评价
  loadRecipeReviews: function(recipeId, page = 1) {
    wx.request({
      url: `http://localhost:3000/api/recipes/${recipeId}/reviews`,
      method: 'GET',
      data: {
        page: page,
        pageSize: this.data.reviewPageSize
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const data = res.data.data;
          const reviews = page === 1 ? data.reviews : [...this.data.reviews, ...data.reviews];
          
          this.setData({
            reviews: reviews,
            ratingBreakdown: data.ratingBreakdown,
            hasMoreReviews: data.hasMore,
            reviewPage: page
          });
        }
      },
      fail: (err) => {
        console.error('加载评价失败:', err);
      }
    });
  },

  // 加载相关菜谱
  loadRelatedRecipes: function(recipeId) {
    wx.request({
      url: `http://localhost:3000/api/recipes/${recipeId}/related`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            relatedRecipes: res.data.data
          });
        }
      },
      fail: (err) => {
        console.error('加载相关菜谱失败:', err);
      }
    });
  },

  // 记录浏览
  recordView: function(recipeId) {
    wx.request({
      url: `http://localhost:3000/api/recipes/${recipeId}/view`,
      method: 'POST',
      success: (res) => {
        // 静默记录浏览
      }
    });
  },

  // 解析食材数据
  parseIngredients: function(ingredientsStr) {
    try {
      return JSON.parse(ingredientsStr || '[]');
    } catch (e) {
      return [];
    }
  },

  // 解析制作步骤
  parseSteps: function(stepsStr) {
    try {
      return JSON.parse(stepsStr || '[]');
    } catch (e) {
      return [];
    }
  },

  // 解析营养信息
  parseNutritionInfo: function(nutritionStr) {
    try {
      const nutrition = JSON.parse(nutritionStr || '{}');
      return Object.keys(nutrition).map(key => ({
        key,
        label: this.getNutritionLabel(key),
        value: nutrition[key]
      }));
    } catch (e) {
      return [];
    }
  },

  // 获取营养标签
  getNutritionLabel: function(key) {
    const labels = {
      calories: '卡路里',
      protein: '蛋白质',
      carbs: '碳水化合物',
      fat: '脂肪',
      fiber: '膳食纤维',
      sodium: '钠',
      sugar: '糖分'
    };
    return labels[key] || key;
  },

  // 切换点赞状态
  toggleLike: function() {
    const recipeId = this.data.recipeId;
    const isLiked = this.data.recipe.is_liked;
    
    wx.request({
      url: `http://localhost:3000/api/recipes/${recipeId}/like`,
      method: 'POST',
      data: {
        action: isLiked ? 'unlike' : 'like'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const recipe = { ...this.data.recipe };
          recipe.is_liked = !isLiked;
          recipe.like_count += isLiked ? -1 : 1;
          this.setData({ recipe });
          
          wx.showToast({
            title: isLiked ? '取消点赞' : '已点赞',
            icon: 'success'
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '操作失败',
          icon: 'error'
        });
      }
    });
  },

  // 切换收藏状态
  toggleCollect: function() {
    const recipeId = this.data.recipeId;
    const isCollected = this.data.recipe.is_collected;
    
    wx.request({
      url: `http://localhost:3000/api/recipes/${recipeId}/collect`,
      method: 'POST',
      data: {
        action: isCollected ? 'uncollect' : 'collect'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const recipe = { ...this.data.recipe };
          recipe.is_collected = !isCollected;
          recipe.collect_count += isCollected ? -1 : 1;
          this.setData({ recipe });
          
          wx.showToast({
            title: isCollected ? '取消收藏' : '已收藏',
            icon: 'success'
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '操作失败',
          icon: 'error'
        });
      }
    });
  },

  // 分享菜谱
  shareRecipe: function() {
    const recipe = this.data.recipe;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 查看更多评价
  loadMoreReviews: function() {
    if (this.data.hasMoreReviews) {
      this.loadRecipeReviews(this.data.recipeId, this.data.reviewPage + 1);
    }
  },

  // 点赞评价
  likeReview: function(e) {
    const reviewId = e.currentTarget.dataset.id;
    const reviews = this.data.reviews;
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    
    if (reviewIndex === -1) return;
    
    const review = reviews[reviewIndex];
    const isLiked = review.is_liked;
    
    wx.request({
      url: `http://localhost:3000/api/reviews/${reviewId}/like`,
      method: 'POST',
      data: {
        action: isLiked ? 'unlike' : 'like'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          reviews[reviewIndex].is_liked = !isLiked;
          reviews[reviewIndex].likes_count += isLiked ? -1 : 1;
          this.setData({ reviews });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '操作失败',
          icon: 'error'
        });
      }
    });
  },

  // 预览图片
  previewImage: function(e) {
    const src = e.currentTarget.dataset.src;
    const urls = this.data.reviews.reduce((acc, review) => {
      return acc.concat(review.images || []);
    }, []);
    
    wx.previewImage({
      current: src,
      urls: urls
    });
  },

  // 跳转到其他菜谱
  goToRecipe: function(e) {
    const recipeId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/recipes/detail/detail?id=${recipeId}`
    });
  },

  // 跳转到创建菜谱页面
  goToCreate: function() {
    wx.navigateTo({
      url: '/pages/recipes/create/create'
    });
  },

  // 写评价
  writeReview: function() {
    // 这里可以跳转到评价页面，或者在当前页面打开评价弹窗
    wx.navigateTo({
      url: `/pages/recipes/review/review?recipeId=${this.data.recipeId}`
    });
  },

  // 分享配置
  onShareAppMessage: function() {
    const recipe = this.data.recipe;
    return {
      title: `${recipe.name} - 美味菜谱分享`,
      path: `/pages/recipes/detail/detail?id=${recipe.id}`,
      imageUrl: recipe.main_image
    };
  },

  onShareTimeline: function() {
    const recipe = this.data.recipe;
    return {
      title: `${recipe.name} - 美味菜谱分享`,
      query: `id=${recipe.id}`,
      imageUrl: recipe.main_image
    };
  }
}); 