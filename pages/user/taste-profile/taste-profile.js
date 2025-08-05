// pages/user/taste-profile/taste-profile.js
const app = getApp();
const API_BASE = app.globalData.apiBase || 'http://localhost:3000/api';

Page({
  data: {
    userId: null,
    completionPercentage: 0,
    
    // 基本口味偏好
    spiceLevel: 'medium',
    sweetnessLevel: 'medium',
    cookingSkillLevel: 'beginner',
    
    // 口味偏好选项
    flavorOptions: [
      { value: 'salty', label: '咸鲜', emoji: '🧂' },
      { value: 'sweet', label: '甜味', emoji: '🍯' },
      { value: 'sour', label: '酸味', emoji: '🍋' },
      { value: 'spicy', label: '辣味', emoji: '🌶️' },
      { value: 'bitter', label: '苦味', emoji: '🌿' },
      { value: 'umami', label: '鲜味', emoji: '🍄' },
      { value: 'aromatic', label: '香味', emoji: '🌹' },
      { value: 'refreshing', label: '清爽', emoji: '🥒' }
    ],
    flavorPreferences: [],
    
    // 菜系偏好选项
    cuisineOptions: [
      { value: 'sichuan', label: '川菜', emoji: '🌶️' },
      { value: 'cantonese', label: '粤菜', emoji: '🦐' },
      { value: 'shandong', label: '鲁菜', emoji: '🐟' },
      { value: 'jiangsu', label: '苏菜', emoji: '🦆' },
      { value: 'zhejiang', label: '浙菜', emoji: '🦀' },
      { value: 'hunan', label: '湘菜', emoji: '🌶️' },
      { value: 'anhui', label: '徽菜', emoji: '🐗' },
      { value: 'fujian', label: '闽菜', emoji: '🦪' },
      { value: 'japanese', label: '日料', emoji: '🍱' },
      { value: 'korean', label: '韩料', emoji: '🍲' },
      { value: 'western', label: '西餐', emoji: '🍝' },
      { value: 'thai', label: '泰菜', emoji: '🍛' }
    ],
    cuisinePreferences: [],
    
    // 饮食限制选项
    dietaryOptions: [
      { value: 'vegetarian', label: '素食', emoji: '🥬' },
      { value: 'vegan', label: '纯素', emoji: '🌱' },
      { value: 'gluten_free', label: '无麸质', emoji: '🌾' },
      { value: 'low_sodium', label: '低盐', emoji: '🧂' },
      { value: 'low_fat', label: '低脂', emoji: '🥗' },
      { value: 'low_sugar', label: '低糖', emoji: '🍯' },
      { value: 'keto', label: '生酮', emoji: '🥑' },
      { value: 'paleo', label: '原始', emoji: '🥩' }
    ],
    dietaryRestrictions: [],
    
    // 过敏信息选项
    allergyOptions: [
      { value: 'nuts', label: '坚果', emoji: '🥜' },
      { value: 'dairy', label: '乳制品', emoji: '🥛' },
      { value: 'eggs', label: '鸡蛋', emoji: '🥚' },
      { value: 'seafood', label: '海鲜', emoji: '🦐' },
      { value: 'soy', label: '大豆', emoji: '🫘' },
      { value: 'gluten', label: '麸质', emoji: '🌾' },
      { value: 'shellfish', label: '贝类', emoji: '🦪' },
      { value: 'fish', label: '鱼类', emoji: '🐟' }
    ],
    allergies: [],
    
    // 智能分析结果
    analysisResult: null,
    
    // 状态控制
    canSave: false,
    canAnalyze: false,
    loading: false
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '口味档案'
    });
    
    // 获取用户ID
    if (options.userId) {
      this.setData({
        userId: options.userId
      });
    } else {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.id) {
        this.setData({
          userId: userInfo.id
        });
      }
    }
    
    this.loadTasteProfile();
  },

  // 加载口味档案
  loadTasteProfile() {
    if (!this.data.userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    wx.request({
      url: `${API_BASE}/users/${this.data.userId}/taste-profile`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const profile = res.data.data;
          this.setData({
            spiceLevel: profile.spice_level || 'medium',
            sweetnessLevel: profile.sweetness_level || 'medium',
            cookingSkillLevel: profile.cooking_skill_level || 'beginner',
            flavorPreferences: profile.flavor_preferences || [],
            cuisinePreferences: profile.cuisine_preferences || [],
            dietaryRestrictions: profile.dietary_restrictions || [],
            allergies: profile.allergies || [],
            loading: false
          });
          
          this.updateCompletionPercentage();
          this.updateCanSave();
          this.updateCanAnalyze();
        } else {
          // 如果没有档案，设置默认值
          this.setData({
            loading: false
          });
          this.updateCompletionPercentage();
          this.updateCanSave();
          this.updateCanAnalyze();
        }
      },
      fail: (error) => {
        console.error('加载口味档案失败:', error);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    });
  },

  // 更新完成度
  updateCompletionPercentage() {
    let completedFields = 0;
    const totalFields = 6; // 基本偏好3个 + 口味偏好 + 菜系偏好 + 其他选项

    // 基本偏好必填项
    if (this.data.spiceLevel) completedFields++;
    if (this.data.sweetnessLevel) completedFields++;
    if (this.data.cookingSkillLevel) completedFields++;

    // 可选项
    if (this.data.flavorPreferences.length > 0) completedFields++;
    if (this.data.cuisinePreferences.length > 0) completedFields++;
    if (this.data.dietaryRestrictions.length > 0 || this.data.allergies.length > 0) completedFields++;

    const percentage = Math.round((completedFields / totalFields) * 100);
    this.setData({
      completionPercentage: percentage
    });
  },

  // 更新保存按钮状态
  updateCanSave() {
    const canSave = this.data.spiceLevel && 
                   this.data.sweetnessLevel && 
                   this.data.cookingSkillLevel;
    this.setData({ canSave });
  },

  // 更新分析按钮状态
  updateCanAnalyze() {
    const canAnalyze = this.data.flavorPreferences.length > 0 && 
                      this.data.cuisinePreferences.length > 0;
    this.setData({ canAnalyze });
  },

  // 辣度偏好变化
  onSpiceLevelChange(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      spiceLevel: value
    });
    this.updateCompletionPercentage();
    this.updateCanSave();
  },

  // 甜度偏好变化
  onSweetnessLevelChange(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      sweetnessLevel: value
    });
    this.updateCompletionPercentage();
    this.updateCanSave();
  },

  // 烹饪技能变化
  onCookingSkillChange(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      cookingSkillLevel: value
    });
    this.updateCompletionPercentage();
    this.updateCanSave();
  },

  // 口味偏好切换
  onFlavorToggle(e) {
    const value = e.currentTarget.dataset.value;
    let flavorPreferences = [...this.data.flavorPreferences];
    
    const index = flavorPreferences.indexOf(value);
    if (index > -1) {
      flavorPreferences.splice(index, 1);
    } else {
      flavorPreferences.push(value);
    }
    
    this.setData({
      flavorPreferences
    });
    this.updateCompletionPercentage();
    this.updateCanAnalyze();
  },

  // 菜系偏好切换
  onCuisineToggle(e) {
    const value = e.currentTarget.dataset.value;
    let cuisinePreferences = [...this.data.cuisinePreferences];
    
    const index = cuisinePreferences.indexOf(value);
    if (index > -1) {
      cuisinePreferences.splice(index, 1);
    } else {
      cuisinePreferences.push(value);
    }
    
    this.setData({
      cuisinePreferences
    });
    this.updateCompletionPercentage();
    this.updateCanAnalyze();
  },

  // 饮食限制切换
  onDietaryToggle(e) {
    const value = e.currentTarget.dataset.value;
    let dietaryRestrictions = [...this.data.dietaryRestrictions];
    
    const index = dietaryRestrictions.indexOf(value);
    if (index > -1) {
      dietaryRestrictions.splice(index, 1);
    } else {
      dietaryRestrictions.push(value);
    }
    
    this.setData({
      dietaryRestrictions
    });
    this.updateCompletionPercentage();
  },

  // 过敏信息切换
  onAllergyToggle(e) {
    const value = e.currentTarget.dataset.value;
    let allergies = [...this.data.allergies];
    
    const index = allergies.indexOf(value);
    if (index > -1) {
      allergies.splice(index, 1);
    } else {
      allergies.push(value);
    }
    
    this.setData({
      allergies
    });
    this.updateCompletionPercentage();
  },

  // 保存档案
  onSave() {
    if (!this.data.canSave) {
      wx.showToast({
        title: '请完善必填项',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '保存中...'
    });

    const profileData = {
      spice_level: this.data.spiceLevel,
      sweetness_level: this.data.sweetnessLevel,
      cooking_skill_level: this.data.cookingSkillLevel,
      flavor_preferences: this.data.flavorPreferences,
      cuisine_preferences: this.data.cuisinePreferences,
      dietary_restrictions: this.data.dietaryRestrictions,
      allergies: this.data.allergies
    };

    wx.request({
      url: `${API_BASE}/users/${this.data.userId}/taste-profile`,
      method: 'PUT',
      data: profileData,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data.success) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 触发自动分析
          if (this.data.canAnalyze) {
            setTimeout(() => {
              this.onAnalyze();
            }, 1000);
          }
        } else {
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('保存口味档案失败:', error);
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
  },

  // 智能分析
  onAnalyze() {
    if (!this.data.canAnalyze) {
      wx.showToast({
        title: '请先完善口味偏好',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '分析中...'
    });

    wx.request({
      url: `${API_BASE}/users/${this.data.userId}/taste-profile/analyze`,
      method: 'POST',
      data: {
        spice_level: this.data.spiceLevel,
        sweetness_level: this.data.sweetnessLevel,
        cooking_skill_level: this.data.cookingSkillLevel,
        flavor_preferences: this.data.flavorPreferences,
        cuisine_preferences: this.data.cuisinePreferences,
        dietary_restrictions: this.data.dietaryRestrictions,
        allergies: this.data.allergies
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data.success) {
          this.setData({
            analysisResult: res.data.data
          });
          
          wx.showToast({
            title: '分析完成',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.data.message || '分析失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('智能分析失败:', error);
        wx.showToast({
          title: '分析失败',
          icon: 'none'
        });
      }
    });
  }
}); 