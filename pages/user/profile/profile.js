// pages/user/profile/profile.js
Page({
  data: {
    userInfo: {},
    tagCount: 0,
    collectionCount: 0,
    recipeCount: 0,
    reviewCount: 0,
    notificationEnabled: true,
    showEditModal: false,
    recentActivities: [],
    
    // 编辑表单数据
    editForm: {
      nickname: '',
      bio: '',
      cooking_level_index: 0
    },
    
    // 常量映射
    levelMap: {
      beginner: '初学者',
      intermediate: '中级厨师',
      advanced: '高级厨师'
    },
    
    verificationMap: {
      chef: '专业厨师',
      nutritionist: '营养师',
      blogger: '美食博主'
    },
    
    cookingLevels: ['初学者', '中级厨师', '高级厨师'],
    cookingLevelKeys: ['beginner', 'intermediate', 'advanced']
  },

  onLoad: function() {
    wx.setNavigationBarTitle({
      title: '个人资料'
    });
    
    this.loadUserProfile();
    this.loadUserStats();
    this.loadRecentActivities();
  },

  // 加载用户档案
  loadUserProfile: function() {
    wx.request({
      url: 'http://localhost:3000/api/user/profile',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          const userInfo = res.data.data;
          this.setData({
            userInfo: userInfo,
            'editForm.nickname': userInfo.nickname || '',
            'editForm.bio': userInfo.bio || '',
            'editForm.cooking_level_index': this.data.cookingLevelKeys.indexOf(userInfo.cooking_level) || 0
          });
        }
      },
      fail: (err) => {
        console.error('加载用户档案失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    });
  },

  // 加载用户统计数据
  loadUserStats: function() {
    wx.request({
      url: 'http://localhost:3000/api/user/stats',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          const stats = res.data.data;
          this.setData({
            tagCount: stats.tagCount || 0,
            collectionCount: stats.collectionCount || 0,
            recipeCount: stats.recipeCount || 0,
            reviewCount: stats.reviewCount || 0
          });
        }
      },
      fail: (err) => {
        console.error('加载用户统计失败:', err);
      }
    });
  },

  // 加载最近活动
  loadRecentActivities: function() {
    wx.request({
      url: 'http://localhost:3000/api/user/activities',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            recentActivities: res.data.data || []
          });
        }
      },
      fail: (err) => {
        console.error('加载最近活动失败:', err);
      }
    });
  },

  // 更换头像
  changeAvatar: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFilePaths[0];
        this.uploadAvatar(filePath);
      }
    });
  },

  // 上传头像
  uploadAvatar: function(filePath) {
    wx.showLoading({
      title: '上传中...'
    });

    wx.uploadFile({
      url: 'http://localhost:3000/api/user/avatar',
      filePath: filePath,
      name: 'avatar',
      success: (res) => {
        const data = JSON.parse(res.data);
        if (data.success) {
          this.setData({
            'userInfo.avatar': data.data.avatar_url
          });
          wx.showToast({
            title: '头像更新成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: data.message || '上传失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('上传头像失败:', err);
        wx.showToast({
          title: '上传失败',
          icon: 'error'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 编辑资料
  editProfile: function() {
    this.setData({
      showEditModal: true
    });
  },

  // 隐藏编辑弹窗
  hideEditModal: function() {
    this.setData({
      showEditModal: false
    });
  },

  // 阻止事件冒泡
  preventClose: function() {
    return false;
  },

  // 保存资料
  saveProfile: function() {
    const { editForm, cookingLevelKeys } = this.data;
    
    if (!editForm.nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'error'
      });
      return;
    }

    wx.showLoading({
      title: '保存中...'
    });

    wx.request({
      url: 'http://localhost:3000/api/user/profile',
      method: 'PUT',
      data: {
        nickname: editForm.nickname,
        bio: editForm.bio,
        cooking_level: cookingLevelKeys[editForm.cooking_level_index]
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const updatedUserInfo = res.data.data;
          this.setData({
            userInfo: updatedUserInfo,
            showEditModal: false
          });
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('保存用户档案失败:', err);
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 表单输入事件
  onNicknameInput: function(e) {
    this.setData({
      'editForm.nickname': e.detail.value
    });
  },

  onBioInput: function(e) {
    this.setData({
      'editForm.bio': e.detail.value
    });
  },

  onCookingLevelChange: function(e) {
    this.setData({
      'editForm.cooking_level_index': parseInt(e.detail.value)
    });
  },

  // 通知开关
  toggleNotification: function(e) {
    this.setData({
      notificationEnabled: e.detail.value
    });
    
    // 保存通知设置
    wx.request({
      url: 'http://localhost:3000/api/user/notification-settings',
      method: 'PUT',
      data: {
        enabled: e.detail.value
      },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({
            title: e.detail.value ? '通知已开启' : '通知已关闭',
            icon: 'success'
          });
        }
      },
      fail: (err) => {
        console.error('更新通知设置失败:', err);
      }
    });
  },

  // 页面跳转
  goToTags: function() {
    wx.navigateTo({
      url: '/pages/user/tags/tags'
    });
  },

  goToTasteProfile: function() {
    wx.navigateTo({
      url: '/pages/user/taste-profile/taste-profile'
    });
  },

  goToCollections: function() {
    wx.navigateTo({
      url: '/pages/user/collections/collections'
    });
  },

  goToRecipes: function() {
    wx.navigateTo({
      url: '/pages/user/recipes/recipes'
    });
  },

  goToReviews: function() {
    wx.navigateTo({
      url: '/pages/user/reviews/reviews'
    });
  },

  goToHomepageConfig: function() {
    wx.navigateTo({
      url: '/pages/user/homepage-config/homepage-config'
    });
  }
});