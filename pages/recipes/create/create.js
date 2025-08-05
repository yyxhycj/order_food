Page({
  data: {
    currentStep: 1,
    isSubmitting: false,
    recipeData: {
      name: '',
      description: '',
      main_image: '',
      cooking_time: null,
      difficulty: 'medium',
      category_id: null,
      seasonal_tags: [],
      ingredients: [
        { name: '', amount: '' }
      ],
      steps: [
        { description: '', image: '' }
      ],
      video_url: '',
      nutrition_info: {
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      },
      status: 'active'
    },
    timeOptions: [
      { label: '10分钟以内', value: 10 },
      { label: '15分钟', value: 15 },
      { label: '20分钟', value: 20 },
      { label: '30分钟', value: 30 },
      { label: '45分钟', value: 45 },
      { label: '60分钟', value: 60 },
      { label: '90分钟', value: 90 },
      { label: '120分钟', value: 120 },
      { label: '120分钟以上', value: 150 }
    ],
    difficultyOptions: [
      { label: '简单', value: 'easy' },
      { label: '中等', value: 'medium' },
      { label: '困难', value: 'hard' }
    ],
    seasonOptions: [
      { label: '春季', value: 'spring' },
      { label: '夏季', value: 'summer' },
      { label: '秋季', value: 'autumn' },
      { label: '冬季', value: 'winter' }
    ],
    categoryOptions: [],
    recommendedIngredients: [],
    selectedTime: '',
    selectedCategory: '',
    difficultyMap: {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    }
  },

  onLoad: function() {
    wx.setNavigationBarTitle({
      title: '创建菜谱'
    });
    this.loadCategories();
  },

  // 加载分类数据
  loadCategories: function() {
    wx.request({
      url: 'http://localhost:3000/api/categories',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            categoryOptions: res.data.data
          });
        }
      },
      fail: (err) => {
        console.error('加载分类失败:', err);
      }
    });
  },

  // 步骤导航
  goToStep: function(e) {
    const step = parseInt(e.currentTarget.dataset.step);
    if (step < this.data.currentStep) {
      this.setData({ currentStep: step });
    }
  },

  // 下一步
  nextStep: function() {
    if (this.validateCurrentStep()) {
      const nextStep = this.data.currentStep + 1;
      this.setData({ currentStep: nextStep });
      
      // 如果进入食材步骤，加载推荐食材
      if (nextStep === 2) {
        this.loadRecommendedIngredients();
      }
    }
  },

  // 上一步
  prevStep: function() {
    const prevStep = this.data.currentStep - 1;
    this.setData({ currentStep: prevStep });
  },

  // 验证当前步骤
  validateCurrentStep: function() {
    const { currentStep, recipeData } = this.data;
    
    switch (currentStep) {
      case 1:
        if (!recipeData.name.trim()) {
          wx.showToast({
            title: '请输入菜谱名称',
            icon: 'error'
          });
          return false;
        }
        if (!recipeData.cooking_time) {
          wx.showToast({
            title: '请选择制作时间',
            icon: 'error'
          });
          return false;
        }
        break;
      case 2:
        const validIngredients = recipeData.ingredients.filter(ing => ing.name.trim() && ing.amount.trim());
        if (validIngredients.length === 0) {
          wx.showToast({
            title: '请添加至少一个食材',
            icon: 'error'
          });
          return false;
        }
        break;
      case 3:
        const validSteps = recipeData.steps.filter(step => step.description.trim());
        if (validSteps.length === 0) {
          wx.showToast({
            title: '请添加至少一个制作步骤',
            icon: 'error'
          });
          return false;
        }
        break;
    }
    
    return true;
  },

  // 输入变化处理
  onInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`recipeData.${field}`]: value
    });
  },

  // 时间选择
  onTimeChange: function(e) {
    const index = e.detail.value;
    const selectedOption = this.data.timeOptions[index];
    
    this.setData({
      'recipeData.cooking_time': selectedOption.value,
      selectedTime: selectedOption.label
    });
  },

  // 难度选择
  selectDifficulty: function(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      'recipeData.difficulty': value
    });
  },

  // 分类选择
  onCategoryChange: function(e) {
    const index = e.detail.value;
    const selectedOption = this.data.categoryOptions[index];
    
    this.setData({
      'recipeData.category_id': selectedOption.id,
      selectedCategory: selectedOption.name
    });
  },

  // 季节标签切换
  toggleSeasonTag: function(e) {
    const value = e.currentTarget.dataset.value;
    const currentTags = this.data.recipeData.seasonal_tags || [];
    
    let newTags;
    if (currentTags.includes(value)) {
      newTags = currentTags.filter(tag => tag !== value);
    } else {
      newTags = [...currentTags, value];
    }
    
    this.setData({
      'recipeData.seasonal_tags': newTags
    });
  },

  // 上传主图片
  uploadMainImage: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.uploadImage(tempFilePath, (imageUrl) => {
          this.setData({
            'recipeData.main_image': imageUrl
          });
        });
      }
    });
  },

  // 预览主图片
  previewMainImage: function() {
    wx.previewImage({
      current: this.data.recipeData.main_image,
      urls: [this.data.recipeData.main_image]
    });
  },

  // 食材变化处理
  onIngredientChange: function(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const ingredients = [...this.data.recipeData.ingredients];
    
    ingredients[index][field] = value;
    
    this.setData({
      'recipeData.ingredients': ingredients
    });
  },

  // 添加食材
  addIngredient: function() {
    const ingredients = [...this.data.recipeData.ingredients];
    ingredients.push({ name: '', amount: '' });
    
    this.setData({
      'recipeData.ingredients': ingredients
    });
  },

  // 删除食材
  removeIngredient: function(e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = [...this.data.recipeData.ingredients];
    
    if (ingredients.length > 1) {
      ingredients.splice(index, 1);
      this.setData({
        'recipeData.ingredients': ingredients
      });
    }
  },

  // 加载推荐食材
  loadRecommendedIngredients: function() {
    const recipeName = this.data.recipeData.name;
    if (!recipeName.trim()) return;
    
    wx.request({
      url: 'http://localhost:3000/api/recipes/recommend-ingredients',
      method: 'POST',
      data: {
        recipeName: recipeName
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            recommendedIngredients: res.data.data
          });
        }
      },
      fail: (err) => {
        console.error('加载推荐食材失败:', err);
      }
    });
  },

  // 添加推荐食材
  addRecommendedIngredient: function(e) {
    const ingredient = e.currentTarget.dataset.ingredient;
    const ingredients = [...this.data.recipeData.ingredients];
    
    // 检查是否已存在
    const exists = ingredients.some(ing => ing.name === ingredient.name);
    if (!exists) {
      ingredients.push(ingredient);
      this.setData({
        'recipeData.ingredients': ingredients
      });
    }
  },

  // 步骤变化处理
  onStepChange: function(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const steps = [...this.data.recipeData.steps];
    
    steps[index][field] = value;
    
    this.setData({
      'recipeData.steps': steps
    });
  },

  // 添加步骤
  addStep: function() {
    const steps = [...this.data.recipeData.steps];
    steps.push({ description: '', image: '' });
    
    this.setData({
      'recipeData.steps': steps
    });
  },

  // 删除步骤
  removeStep: function(e) {
    const index = e.currentTarget.dataset.index;
    const steps = [...this.data.recipeData.steps];
    
    if (steps.length > 1) {
      steps.splice(index, 1);
      this.setData({
        'recipeData.steps': steps
      });
    }
  },

  // 上传步骤图片
  uploadStepImage: function(e) {
    const index = e.currentTarget.dataset.index;
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.uploadImage(tempFilePath, (imageUrl) => {
          const steps = [...this.data.recipeData.steps];
          steps[index].image = imageUrl;
          this.setData({
            'recipeData.steps': steps
          });
        });
      }
    });
  },

  // 删除步骤图片
  removeStepImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const steps = [...this.data.recipeData.steps];
    steps[index].image = '';
    
    this.setData({
      'recipeData.steps': steps
    });
  },

  // 预览步骤图片
  previewStepImage: function(e) {
    const src = e.currentTarget.dataset.src;
    wx.previewImage({
      current: src,
      urls: [src]
    });
  },

  // 上传视频
  uploadVideo: function() {
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFilePath;
        this.uploadVideoFile(tempFilePath, (videoUrl) => {
          this.setData({
            'recipeData.video_url': videoUrl
          });
        });
      }
    });
  },

  // 删除视频
  removeVideo: function() {
    this.setData({
      'recipeData.video_url': ''
    });
  },

  // 营养信息变化
  onNutritionChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`recipeData.nutrition_info.${field}`]: value
    });
  },

  // 状态变化
  onStatusChange: function(e) {
    const status = e.detail.value ? 'active' : 'draft';
    this.setData({
      'recipeData.status': status
    });
  },

  // 提交菜谱
  submitRecipe: function() {
    if (!this.validateCurrentStep()) {
      return;
    }
    
    this.setData({ isSubmitting: true });
    
    // 准备提交数据
    const submitData = {
      ...this.data.recipeData,
      ingredients: JSON.stringify(this.data.recipeData.ingredients.filter(ing => ing.name.trim() && ing.amount.trim())),
      steps: JSON.stringify(this.data.recipeData.steps.filter(step => step.description.trim())),
      nutrition_info: JSON.stringify(this.data.recipeData.nutrition_info),
      seasonal_tags: this.data.recipeData.seasonal_tags.join(',')
    };
    
    wx.request({
      url: 'http://localhost:3000/api/recipes',
      method: 'POST',
      data: submitData,
      success: (res) => {
        if (res.statusCode === 201) {
          wx.showToast({
            title: '菜谱发布成功',
            icon: 'success'
          });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: res.data.message || '发布失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('提交菜谱失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      },
      complete: () => {
        this.setData({ isSubmitting: false });
      }
    });
  },

  // 通用图片上传方法
  uploadImage: function(filePath, callback) {
    wx.showLoading({
      title: '上传中...'
    });
    
    wx.uploadFile({
      url: 'http://localhost:3000/api/upload/image',
      filePath: filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.success) {
            callback(data.data.url);
          } else {
            wx.showToast({
              title: '上传失败',
              icon: 'error'
            });
          }
        } catch (e) {
          wx.showToast({
            title: '上传失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('上传图片失败:', err);
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

  // 通用视频上传方法
  uploadVideoFile: function(filePath, callback) {
    wx.showLoading({
      title: '上传中...'
    });
    
    wx.uploadFile({
      url: 'http://localhost:3000/api/upload/video',
      filePath: filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.success) {
            callback(data.data.url);
          } else {
            wx.showToast({
              title: '上传失败',
              icon: 'error'
            });
          }
        } catch (e) {
          wx.showToast({
            title: '上传失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('上传视频失败:', err);
        wx.showToast({
          title: '上传失败',
          icon: 'error'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
}); 