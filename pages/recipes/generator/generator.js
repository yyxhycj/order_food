Page({
  data: {
    generationMode: 'ingredients', // ingredients, theme, preference
    inputMethod: 'manual', // manual, voice, scan
    isGenerating: false,
    canGenerate: false,
    
    // 食材输入相关
    selectedIngredients: [],
    currentIngredient: '',
    recommendIngredients: ['鸡蛋', '西红柿', '土豆', '洋葱', '胡萝卜', '豆腐', '鸡肉', '猪肉'],
    
    // 语音输入相关
    isListening: false,
    voiceResult: '',
    
    // 主题生成相关
    themeCategories: [
      { id: 1, name: '时令', icon: '/images/seasonal.png' },
      { id: 2, name: '节日', icon: '/images/festival.png' },
      { id: 3, name: '健康', icon: '/images/healthy.png' },
      { id: 4, name: '快手', icon: '/images/quick.png' },
      { id: 5, name: '聚餐', icon: '/images/party.png' },
      { id: 6, name: '减脂', icon: '/images/diet.png' }
    ],
    selectedThemeCategory: null,
    themeOptions: [],
    selectedTheme: null,
    
    // 偏好生成相关
    tasteOptions: [
      { label: '清淡', value: 'light' },
      { label: '麻辣', value: 'spicy' },
      { label: '酸甜', value: 'sweet_sour' },
      { label: '咸鲜', value: 'salty' },
      { label: '香辣', value: 'aromatic_spicy' }
    ],
    selectedTastes: [],
    
    cuisineOptions: [
      { label: '川菜', value: 'sichuan' },
      { label: '粤菜', value: 'cantonese' },
      { label: '鲁菜', value: 'shandong' },
      { label: '苏菜', value: 'jiangsu' },
      { label: '浙菜', value: 'zhejiang' },
      { label: '湘菜', value: 'hunan' },
      { label: '徽菜', value: 'anhui' },
      { label: '闽菜', value: 'fujian' },
      { label: '日韩', value: 'japanese_korean' },
      { label: '西餐', value: 'western' }
    ],
    selectedCuisines: [],
    
    timeRanges: [
      { label: '15分钟内', value: 15 },
      { label: '30分钟内', value: 30 },
      { label: '1小时内', value: 60 },
      { label: '2小时内', value: 120 },
      { label: '不限时间', value: 0 }
    ],
    selectedTimeRange: '',
    
    selectedDifficulty: 3,
    
    // 高级设置
    nutritionOptions: [
      { label: '高蛋白', value: 'high_protein' },
      { label: '低脂肪', value: 'low_fat' },
      { label: '高纤维', value: 'high_fiber' },
      { label: '低糖', value: 'low_sugar' },
      { label: '补钙', value: 'calcium_rich' },
      { label: '补铁', value: 'iron_rich' }
    ],
    selectedNutrition: [],
    
    restrictionOptions: [
      { label: '素食', value: 'vegetarian' },
      { label: '无麸质', value: 'gluten_free' },
      { label: '无坚果', value: 'nut_free' },
      { label: '无乳制品', value: 'dairy_free' },
      { label: '无海鲜', value: 'seafood_free' }
    ],
    selectedRestrictions: [],
    
    generateQuantity: 3,
    
    // 生成结果
    generatedRecipes: [],
    
    // 生成历史
    generateHistory: []
  },

  onLoad: function() {
    wx.setNavigationBarTitle({
      title: '智能菜谱生成'
    });
    
    this.loadGenerateHistory();
    this.updateCanGenerate();
  },

  // 切换生成模式
  switchMode: function(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      generationMode: mode,
      generatedRecipes: []
    });
    this.updateCanGenerate();
  },

  // 切换输入方式
  switchInputMethod: function(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      inputMethod: method
    });
  },

  // 食材输入处理
  onIngredientInput: function(e) {
    this.setData({
      currentIngredient: e.detail.value
    });
  },

  // 添加食材
  addIngredient: function() {
    const ingredient = this.data.currentIngredient.trim();
    if (ingredient && !this.data.selectedIngredients.includes(ingredient)) {
      this.setData({
        selectedIngredients: [...this.data.selectedIngredients, ingredient],
        currentIngredient: ''
      });
      this.updateCanGenerate();
    }
  },

  // 删除食材
  removeIngredient: function(e) {
    const ingredient = e.currentTarget.dataset.ingredient;
    const newIngredients = this.data.selectedIngredients.filter(item => item !== ingredient);
    this.setData({
      selectedIngredients: newIngredients
    });
    this.updateCanGenerate();
  },

  // 选择推荐食材
  selectRecommendIngredient: function(e) {
    const ingredient = e.currentTarget.dataset.ingredient;
    if (!this.data.selectedIngredients.includes(ingredient)) {
      this.setData({
        selectedIngredients: [...this.data.selectedIngredients, ingredient]
      });
      this.updateCanGenerate();
    }
  },

  // 语音输入切换
  toggleVoiceInput: function() {
    if (this.data.isListening) {
      this.stopVoiceInput();
    } else {
      this.startVoiceInput();
    }
  },

  // 开始语音输入
  startVoiceInput: function() {
    this.setData({ isListening: true });
    
    wx.getRecorderManager().start({
      duration: 10000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'aac',
      frameSize: 50
    });
    
    // 模拟语音识别结果
    setTimeout(() => {
      this.setData({
        isListening: false,
        voiceResult: '鸡蛋、西红柿、土豆'
      });
    }, 3000);
  },

  // 停止语音输入
  stopVoiceInput: function() {
    wx.getRecorderManager().stop();
    this.setData({ isListening: false });
  },

  // 确认语音输入
  confirmVoiceInput: function() {
    const ingredients = this.data.voiceResult.split(/[、，,]/);
    const newIngredients = [...this.data.selectedIngredients];
    
    ingredients.forEach(ingredient => {
      const cleaned = ingredient.trim();
      if (cleaned && !newIngredients.includes(cleaned)) {
        newIngredients.push(cleaned);
      }
    });
    
    this.setData({
      selectedIngredients: newIngredients,
      voiceResult: ''
    });
    this.updateCanGenerate();
  },

  // 扫描识别食材
  scanIngredients: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.recognizeIngredients(tempFilePath);
      }
    });
  },

  // 识别食材
  recognizeIngredients: function(imagePath) {
    wx.showLoading({
      title: '识别中...'
    });
    
    // 模拟AI识别结果
    setTimeout(() => {
      const recognizedIngredients = ['鸡蛋', '牛奶', '面包', '香蕉'];
      const newIngredients = [...this.data.selectedIngredients];
      
      recognizedIngredients.forEach(ingredient => {
        if (!newIngredients.includes(ingredient)) {
          newIngredients.push(ingredient);
        }
      });
      
      this.setData({
        selectedIngredients: newIngredients
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '识别成功',
        icon: 'success'
      });
      
      this.updateCanGenerate();
    }, 2000);
  },

  // 选择主题分类
  selectThemeCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedThemeCategory: category,
      selectedTheme: null
    });
    this.loadThemeOptions(category.id);
  },

  // 加载主题选项
  loadThemeOptions: function(categoryId) {
    const optionsMap = {
      1: [ // 时令
        { id: 11, name: '春季养生', image: '/images/spring.jpg' },
        { id: 12, name: '夏日清爽', image: '/images/summer.jpg' },
        { id: 13, name: '秋季滋补', image: '/images/autumn.jpg' },
        { id: 14, name: '冬日暖身', image: '/images/winter.jpg' }
      ],
      2: [ // 节日
        { id: 21, name: '春节团圆', image: '/images/spring_festival.jpg' },
        { id: 22, name: '中秋佳节', image: '/images/mid_autumn.jpg' },
        { id: 23, name: '端午飘香', image: '/images/dragon_boat.jpg' },
        { id: 24, name: '生日聚会', image: '/images/birthday.jpg' }
      ],
      3: [ // 健康
        { id: 31, name: '营养均衡', image: '/images/balanced.jpg' },
        { id: 32, name: '清肠排毒', image: '/images/detox.jpg' },
        { id: 33, name: '补气养血', image: '/images/nourish.jpg' },
        { id: 34, name: '美容养颜', image: '/images/beauty.jpg' }
      ]
    };
    
    this.setData({
      themeOptions: optionsMap[categoryId] || []
    });
  },

  // 选择主题
  selectTheme: function(e) {
    const theme = e.currentTarget.dataset.theme;
    this.setData({
      selectedTheme: theme.id
    });
    this.updateCanGenerate();
  },

  // 切换口味偏好
  toggleTaste: function(e) {
    const taste = e.currentTarget.dataset.taste;
    const selectedTastes = [...this.data.selectedTastes];
    
    if (selectedTastes.includes(taste)) {
      selectedTastes.splice(selectedTastes.indexOf(taste), 1);
    } else {
      selectedTastes.push(taste);
    }
    
    this.setData({ selectedTastes });
    this.updateCanGenerate();
  },

  // 切换菜系偏好
  toggleCuisine: function(e) {
    const cuisine = e.currentTarget.dataset.cuisine;
    const selectedCuisines = [...this.data.selectedCuisines];
    
    if (selectedCuisines.includes(cuisine)) {
      selectedCuisines.splice(selectedCuisines.indexOf(cuisine), 1);
    } else {
      selectedCuisines.push(cuisine);
    }
    
    this.setData({ selectedCuisines });
    this.updateCanGenerate();
  },

  // 时间范围选择
  onTimeRangeChange: function(e) {
    const index = e.detail.value;
    const selectedOption = this.data.timeRanges[index];
    this.setData({
      selectedTimeRange: selectedOption.label
    });
    this.updateCanGenerate();
  },

  // 难度选择
  onDifficultyChange: function(e) {
    this.setData({
      selectedDifficulty: e.detail.value
    });
    this.updateCanGenerate();
  },

  // 切换营养需求
  toggleNutrition: function(e) {
    const nutrition = e.currentTarget.dataset.nutrition;
    const selectedNutrition = [...this.data.selectedNutrition];
    
    if (selectedNutrition.includes(nutrition)) {
      selectedNutrition.splice(selectedNutrition.indexOf(nutrition), 1);
    } else {
      selectedNutrition.push(nutrition);
    }
    
    this.setData({ selectedNutrition });
  },

  // 切换饮食限制
  toggleRestriction: function(e) {
    const restriction = e.currentTarget.dataset.restriction;
    const selectedRestrictions = [...this.data.selectedRestrictions];
    
    if (selectedRestrictions.includes(restriction)) {
      selectedRestrictions.splice(selectedRestrictions.indexOf(restriction), 1);
    } else {
      selectedRestrictions.push(restriction);
    }
    
    this.setData({ selectedRestrictions });
  },

  // 设置生成数量
  setQuantity: function(e) {
    const quantity = parseInt(e.currentTarget.dataset.quantity);
    this.setData({
      generateQuantity: quantity
    });
  },

  // 更新是否可以生成
  updateCanGenerate: function() {
    const { generationMode, selectedIngredients, selectedTheme, selectedTastes, selectedCuisines } = this.data;
    
    let canGenerate = false;
    
    switch (generationMode) {
      case 'ingredients':
        canGenerate = selectedIngredients.length > 0;
        break;
      case 'theme':
        canGenerate = selectedTheme !== null;
        break;
      case 'preference':
        canGenerate = selectedTastes.length > 0 || selectedCuisines.length > 0;
        break;
    }
    
    this.setData({ canGenerate });
  },

  // 生成菜谱
  generateRecipes: function() {
    if (!this.data.canGenerate || this.data.isGenerating) {
      return;
    }
    
    this.setData({ isGenerating: true });
    
    const generateParams = this.buildGenerateParams();
    
    wx.request({
      url: 'http://localhost:3000/api/recipes/generate',
      method: 'POST',
      data: generateParams,
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            generatedRecipes: res.data.data
          });
          
          // 保存生成历史
          this.saveGenerateHistory(generateParams);
          
          wx.showToast({
            title: '生成成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.data.message || '生成失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('生成菜谱失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      },
      complete: () => {
        this.setData({ isGenerating: false });
      }
    });
  },

  // 构建生成参数
  buildGenerateParams: function() {
    const { generationMode, selectedIngredients, selectedTheme, selectedTastes, selectedCuisines, selectedTimeRange, selectedDifficulty, selectedNutrition, selectedRestrictions, generateQuantity } = this.data;
    
    const params = {
      mode: generationMode,
      quantity: generateQuantity,
      difficulty: selectedDifficulty,
      nutrition: selectedNutrition,
      restrictions: selectedRestrictions
    };
    
    switch (generationMode) {
      case 'ingredients':
        params.ingredients = selectedIngredients;
        break;
      case 'theme':
        params.theme = selectedTheme;
        break;
      case 'preference':
        params.tastes = selectedTastes;
        params.cuisines = selectedCuisines;
        params.timeRange = selectedTimeRange;
        break;
    }
    
    return params;
  },

  // 重新生成
  regenerateRecipes: function() {
    this.generateRecipes();
  },

  // 查看菜谱
  viewRecipe: function(e) {
    const recipe = e.currentTarget.dataset.recipe;
    // 这里可以跳转到菜谱详情页或者显示完整菜谱
    wx.navigateTo({
      url: `/pages/recipes/detail/detail?id=${recipe.id}`
    });
  },

  // 保存菜谱
  saveRecipe: function(e) {
    const recipe = e.currentTarget.dataset.recipe;
    
    wx.request({
      url: 'http://localhost:3000/api/recipes',
      method: 'POST',
      data: recipe,
      success: (res) => {
        if (res.statusCode === 201) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      }
    });
  },

  // 分享菜谱
  shareRecipe: function(e) {
    const recipe = e.currentTarget.dataset.recipe;
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 保存生成历史
  saveGenerateHistory: function(params) {
    const historyItem = {
      id: Date.now(),
      mode: this.getModeText(params.mode),
      time: new Date().toLocaleString(),
      params: this.getParamsText(params)
    };
    
    const history = [historyItem, ...this.data.generateHistory.slice(0, 9)];
    this.setData({ generateHistory: history });
    
    // 保存到本地存储
    wx.setStorageSync('generateHistory', history);
  },

  // 获取模式文本
  getModeText: function(mode) {
    const modeMap = {
      ingredients: '食材生成',
      theme: '主题生成',
      preference: '偏好生成'
    };
    return modeMap[mode] || mode;
  },

  // 获取参数文本
  getParamsText: function(params) {
    switch (params.mode) {
      case 'ingredients':
        return `食材：${params.ingredients.join('、')}`;
      case 'theme':
        return `主题：${params.theme}`;
      case 'preference':
        return `口味：${params.tastes.join('、')} 菜系：${params.cuisines.join('、')}`;
      default:
        return '';
    }
  },

  // 加载生成历史
  loadGenerateHistory: function() {
    try {
      const history = wx.getStorageSync('generateHistory') || [];
      this.setData({ generateHistory: history });
    } catch (e) {
      console.error('加载生成历史失败:', e);
    }
  },

  // 查看历史
  viewHistory: function(e) {
    const history = e.currentTarget.dataset.history;
    // 这里可以根据历史记录重新设置参数
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }
}); 