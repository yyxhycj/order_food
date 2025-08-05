Page({
  data: {
    recipeId: '',
    recipe: {},
    userInfo: {},
    
    // 评分数据
    ratings: {
      taste: 5,
      difficulty: 5,
      ingredients: 5,
      value: 5
    },
    overallRating: 5,
    
    // 评价内容
    reviewContent: '',
    uploadedImages: [],
    selectedSeason: '',
    selectedChallenge: 'none',
    
    // 选项配置
    seasonOptions: [
      { label: '春季', value: 'spring' },
      { label: '夏季', value: 'summer' },
      { label: '秋季', value: 'autumn' },
      { label: '冬季', value: 'winter' }
    ],
    
    challengeOptions: [
      { label: '无挑战', value: 'none', icon: '/images/challenge-none.png' },
      { label: '还原挑战', value: 'restoration', icon: '/images/challenge-restoration.png' },
      { label: '创新挑战', value: 'innovation', icon: '/images/challenge-innovation.png' }
    ],
    
    // 映射
    difficultyMap: {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    },
    
    seasonMap: {
      spring: '春季',
      summer: '夏季',
      autumn: '秋季',
      winter: '冬季'
    },
    
    challengeMap: {
      none: '无挑战',
      restoration: '还原挑战',
      innovation: '创新挑战'
    }
  },

  computed: {
    canSubmit() {
      return this.data.reviewContent.trim().length > 0 || this.data.uploadedImages.length > 0;
    }
  },

  onLoad: function(options) {
    const recipeId = options.recipeId;
    if (recipeId) {
      this.setData({ recipeId });
      this.loadRecipeInfo(recipeId);
    }
    
    this.loadUserInfo();
    this.setCurrentSeason();
  },

  // 加载菜谱信息
  loadRecipeInfo: function(recipeId) {
    wx.request({
      url: `http://localhost:3000/api/recipes/${recipeId}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            recipe: res.data.data
          });
          
          wx.setNavigationBarTitle({
            title: `评价 ${res.data.data.name}`
          });
        }
      },
      fail: (err) => {
        console.error('加载菜谱信息失败:', err);
        wx.showToast({
          title: '加载菜谱信息失败',
          icon: 'error'
        });
      }
    });
  },

  // 加载用户信息
  loadUserInfo: function() {
    wx.request({
      url: 'http://localhost:3000/api/user/profile',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            userInfo: res.data.data
          });
        }
      },
      fail: (err) => {
        console.error('加载用户信息失败:', err);
      }
    });
  },

  // 设置当前季节
  setCurrentSeason: function() {
    const month = new Date().getMonth() + 1;
    let season = '';
    
    if (month >= 3 && month <= 5) {
      season = 'spring';
    } else if (month >= 6 && month <= 8) {
      season = 'summer';
    } else if (month >= 9 && month <= 11) {
      season = 'autumn';
    } else {
      season = 'winter';
    }
    
    this.setData({
      selectedSeason: season
    });
  },

  // 设置评分
  setRating: function(e) {
    const { type, rating } = e.currentTarget.dataset;
    const newRatings = { ...this.data.ratings };
    newRatings[type] = parseInt(rating);
    
    this.setData({
      ratings: newRatings
    });
    
    this.calculateOverallRating();
  },

  // 计算总体评分
  calculateOverallRating: function() {
    const { ratings } = this.data;
    const weights = {
      taste: 0.3,
      difficulty: 0.2,
      ingredients: 0.25,
      value: 0.25
    };
    
    const weightedSum = Object.keys(weights).reduce((sum, key) => {
      return sum + (ratings[key] * weights[key]);
    }, 0);
    
    const overallRating = Math.round(weightedSum * 100) / 100;
    
    this.setData({
      overallRating: overallRating
    });
  },

  // 评价内容输入
  onContentInput: function(e) {
    this.setData({
      reviewContent: e.detail.value
    });
  },

  // 上传图片
  uploadImage: function() {
    const remainingCount = 9 - this.data.uploadedImages.length;
    
    wx.chooseImage({
      count: remainingCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        this.uploadImages(tempFilePaths);
      }
    });
  },

  // 批量上传图片
  uploadImages: function(tempFilePaths) {
    wx.showLoading({
      title: '上传中...'
    });

    const uploadPromises = tempFilePaths.map(filePath => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: 'http://localhost:3000/api/upload/image',
          filePath: filePath,
          name: 'image',
          success: (res) => {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve(data.data.url);
            } else {
              reject(new Error(data.message));
            }
          },
          fail: reject
        });
      });
    });

    Promise.all(uploadPromises)
      .then(urls => {
        this.setData({
          uploadedImages: [...this.data.uploadedImages, ...urls]
        });
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });
      })
      .catch(err => {
        console.error('上传图片失败:', err);
        wx.showToast({
          title: '上传失败',
          icon: 'error'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  // 删除图片
  removeImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const uploadedImages = [...this.data.uploadedImages];
    uploadedImages.splice(index, 1);
    
    this.setData({
      uploadedImages: uploadedImages
    });
  },

  // 选择季节
  selectSeason: function(e) {
    const season = e.currentTarget.dataset.season;
    this.setData({
      selectedSeason: season
    });
  },

  // 选择挑战类型
  selectChallenge: function(e) {
    const challenge = e.currentTarget.dataset.challenge;
    this.setData({
      selectedChallenge: challenge
    });
  },

  // 提交评价
  submitReview: function() {
    const { recipeId, ratings, overallRating, reviewContent, uploadedImages, selectedSeason, selectedChallenge } = this.data;
    
    if (!reviewContent.trim() && uploadedImages.length === 0) {
      wx.showToast({
        title: '请填写评价内容或上传图片',
        icon: 'error'
      });
      return;
    }

    wx.showLoading({
      title: '提交中...'
    });

    wx.request({
      url: `http://localhost:3000/api/recipes/${recipeId}/reviews`,
      method: 'POST',
      data: {
        overall_rating: overallRating,
        taste_rating: ratings.taste,
        difficulty_rating: ratings.difficulty,
        ingredients_rating: ratings.ingredients,
        value_rating: ratings.value,
        content: reviewContent,
        images: uploadedImages,
        season_tag: selectedSeason,
        challenge_type: selectedChallenge
      },
      success: (res) => {
        if (res.statusCode === 201) {
          wx.showToast({
            title: '评价提交成功',
            icon: 'success'
          });
          
          // 延迟返回
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: res.data.message || '提交失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('提交评价失败:', err);
        wx.showToast({
          title: '提交失败',
          icon: 'error'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 预览图片
  previewImage: function(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.uploadedImages[index],
      urls: this.data.uploadedImages
    });
  }
}); 