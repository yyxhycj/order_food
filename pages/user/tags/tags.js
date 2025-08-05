Page({
  data: {
    userInfo: {},
    userTags: [],
    autoTagsCount: 0,
    selectedCategory: 'all',
    filteredTags: [],
    newTagName: '',
    isGenerating: false,
    selectedTag: null,
    
    tagCategories: [
      { label: '全部', value: 'all' },
      { label: '菜系', value: 'cuisine' },
      { label: '口味', value: 'taste' },
      { label: '风格', value: 'style' },
      { label: '技能', value: 'skill' }
    ],
    
    recommendedTags: [],
    tagHistory: [],
    
    // 统计数据
    cuisineStats: {},
    tasteStats: {},
    styleStats: {},
    skillStats: {}
  },

  onLoad: function() {
    wx.setNavigationBarTitle({
      title: '我的标签'
    });
    
    this.loadUserInfo();
    this.loadUserTags();
    this.loadRecommendedTags();
    this.loadTagHistory();
    this.loadTagStatistics();
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

  // 加载用户标签
  loadUserTags: function() {
    wx.request({
      url: 'http://localhost:3000/api/user/tags',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          const tags = res.data.data;
          
          // 为标签云计算字体大小和透明度
          const processedTags = this.processTagsForCloud(tags);
          
          this.setData({
            userTags: processedTags,
            autoTagsCount: tags.filter(tag => tag.tag_type === 'auto').length
          });
          
          this.filterTags();
        }
      },
      fail: (err) => {
        console.error('加载用户标签失败:', err);
      }
    });
  },

  // 处理标签云显示
  processTagsForCloud: function(tags) {
    if (tags.length === 0) return [];
    
    // 按置信度排序
    tags.sort((a, b) => b.confidence_score - a.confidence_score);
    
    // 计算字体大小和透明度
    const maxScore = Math.max(...tags.map(tag => tag.confidence_score));
    const minScore = Math.min(...tags.map(tag => tag.confidence_score));
    const scoreRange = maxScore - minScore || 1;
    
    return tags.map(tag => ({
      ...tag,
      fontSize: 24 + (tag.confidence_score - minScore) / scoreRange * 20, // 24-44rpx
      opacity: 0.6 + (tag.confidence_score - minScore) / scoreRange * 0.4 // 0.6-1.0
    }));
  },

  // 刷新标签
  refreshTags: function() {
    wx.showLoading({
      title: '刷新中...'
    });
    
    this.loadUserTags();
    
    setTimeout(() => {
      wx.hideLoading();
    }, 1000);
  },

  // 切换分类
  switchCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: category
    });
    this.filterTags();
  },

  // 过滤标签
  filterTags: function() {
    const { userTags, selectedCategory } = this.data;
    
    let filtered = userTags;
    if (selectedCategory !== 'all') {
      filtered = userTags.filter(tag => tag.tag_category === selectedCategory);
    }
    
    this.setData({
      filteredTags: filtered
    });
  },

  // 选择标签
  selectTag: function(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({
      selectedTag: tag
    });
  },

  // 关闭标签详情
  closeTagDetail: function() {
    this.setData({
      selectedTag: null
    });
  },

  // 防止弹窗关闭
  preventClose: function() {
    // 阻止事件冒泡
  },

  // 标签输入处理
  onTagInput: function(e) {
    this.setData({
      newTagName: e.detail.value
    });
  },

  // 添加标签
  addTag: function() {
    const tagName = this.data.newTagName.trim();
    if (!tagName) {
      wx.showToast({
        title: '请输入标签名称',
        icon: 'error'
      });
      return;
    }
    
    // 检查标签是否已存在
    const exists = this.data.userTags.some(tag => tag.tag_name === tagName);
    if (exists) {
      wx.showToast({
        title: '标签已存在',
        icon: 'error'
      });
      return;
    }
    
    wx.request({
      url: 'http://localhost:3000/api/user/tags',
      method: 'POST',
      data: {
        tag_name: tagName,
        tag_type: 'manual',
        tag_category: this.data.selectedCategory !== 'all' ? this.data.selectedCategory : 'custom',
        confidence_score: 1.0
      },
      success: (res) => {
        if (res.statusCode === 201) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
          
          this.setData({
            newTagName: ''
          });
          
          this.loadUserTags();
        } else {
          wx.showToast({
            title: res.data.message || '添加失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('添加标签失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      }
    });
  },

  // 编辑标签
  editTag: function(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({
      selectedTag: tag
    });
  },

  // 删除标签
  deleteTag: function(e) {
    const tag = e.currentTarget.dataset.tag;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除标签"${tag.tag_name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.performDeleteTag(tag);
        }
      }
    });
  },

  // 执行删除标签
  performDeleteTag: function(tag) {
    wx.request({
      url: `http://localhost:3000/api/user/tags/${tag.id}`,
      method: 'DELETE',
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          this.loadUserTags();
        } else {
          wx.showToast({
            title: res.data.message || '删除失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('删除标签失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      }
    });
  },

  // 从菜谱生成标签
  generateFromRecipes: function() {
    this.generateTags('recipes');
  },

  // 从订单生成标签
  generateFromOrders: function() {
    this.generateTags('orders');
  },

  // 从评价生成标签
  generateFromReviews: function() {
    this.generateTags('reviews');
  },

  // 生成标签
  generateTags: function(source) {
    wx.showLoading({
      title: '生成中...'
    });
    
    wx.request({
      url: 'http://localhost:3000/api/user/tags/generate',
      method: 'POST',
      data: {
        source: source
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const newTags = res.data.data;
          
          wx.hideLoading();
          
          if (newTags.length > 0) {
            wx.showModal({
              title: '标签生成成功',
              content: `为您生成了${newTags.length}个新标签`,
              success: (modalRes) => {
                if (modalRes.confirm) {
                  this.loadUserTags();
                }
              }
            });
          } else {
            wx.showToast({
              title: '未发现新标签',
              icon: 'none'
            });
          }
        } else {
          wx.hideLoading();
          wx.showToast({
            title: res.data.message || '生成失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('生成标签失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      }
    });
  },

  // 一键生成所有标签
  generateAllTags: function() {
    this.setData({
      isGenerating: true
    });
    
    wx.request({
      url: 'http://localhost:3000/api/user/tags/generate-all',
      method: 'POST',
      success: (res) => {
        if (res.statusCode === 200) {
          const result = res.data.data;
          
          wx.showModal({
            title: '标签生成完成',
            content: `为您生成了${result.totalGenerated}个标签`,
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.loadUserTags();
                this.loadTagStatistics();
              }
            }
          });
        } else {
          wx.showToast({
            title: res.data.message || '生成失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('生成所有标签失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      },
      complete: () => {
        this.setData({
          isGenerating: false
        });
      }
    });
  },

  // 加载推荐标签
  loadRecommendedTags: function() {
    wx.request({
      url: 'http://localhost:3000/api/user/tags/recommendations',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            recommendedTags: res.data.data
          });
        }
      },
      fail: (err) => {
        console.error('加载推荐标签失败:', err);
      }
    });
  },

  // 添加推荐标签
  addRecommendedTag: function(e) {
    const tag = e.currentTarget.dataset.tag;
    
    wx.request({
      url: 'http://localhost:3000/api/user/tags',
      method: 'POST',
      data: {
        tag_name: tag.tag_name,
        tag_type: 'auto',
        tag_category: tag.tag_category,
        confidence_score: tag.confidence_score
      },
      success: (res) => {
        if (res.statusCode === 201) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
          
          // 从推荐列表中移除
          const newRecommended = this.data.recommendedTags.filter(t => t.tag_name !== tag.tag_name);
          this.setData({
            recommendedTags: newRecommended
          });
          
          this.loadUserTags();
        } else {
          wx.showToast({
            title: res.data.message || '添加失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('添加推荐标签失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      }
    });
  },

  // 加载标签历史
  loadTagHistory: function() {
    wx.request({
      url: 'http://localhost:3000/api/user/tags/history',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            tagHistory: res.data.data
          });
        }
      },
      fail: (err) => {
        console.error('加载标签历史失败:', err);
      }
    });
  },

  // 加载标签统计
  loadTagStatistics: function() {
    wx.request({
      url: 'http://localhost:3000/api/user/tags/statistics',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          const stats = res.data.data;
          this.setData({
            cuisineStats: stats.cuisine || {},
            tasteStats: stats.taste || {},
            styleStats: stats.style || {},
            skillStats: stats.skill || {}
          });
          
          // 绘制统计图表
          this.drawTagChart(stats);
        }
      },
      fail: (err) => {
        console.error('加载标签统计失败:', err);
      }
    });
  },

  // 绘制标签统计图表
  drawTagChart: function(stats) {
    const ctx = wx.createCanvasContext('tagChart');
    const canvasWidth = 300;
    const canvasHeight = 200;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = 60;
    
    // 准备数据
    const data = [
      { label: '菜系', value: stats.cuisine?.count || 0, color: '#FF6B6B' },
      { label: '口味', value: stats.taste?.count || 0, color: '#4ECDC4' },
      { label: '风格', value: stats.style?.count || 0, color: '#45B7D1' },
      { label: '技能', value: stats.skill?.count || 0, color: '#FFA07A' }
    ];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0) return;
    
    // 绘制饼图
    let currentAngle = 0;
    
    data.forEach(item => {
      const angle = (item.value / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
      ctx.setFillStyle(item.color);
      ctx.fill();
      
      currentAngle += angle;
    });
    
    // 绘制标签
    data.forEach((item, index) => {
      const y = 20 + index * 25;
      
      ctx.setFillStyle(item.color);
      ctx.fillRect(220, y, 15, 15);
      
      ctx.setFillStyle('#333');
      ctx.setFontSize(12);
      ctx.fillText(`${item.label}: ${item.value}`, 245, y + 12);
    });
    
    ctx.draw();
  },

  // 保存标签修改
  saveTagChanges: function() {
    const tag = this.data.selectedTag;
    if (!tag) return;
    
    wx.request({
      url: `http://localhost:3000/api/user/tags/${tag.id}`,
      method: 'PUT',
      data: tag,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          this.setData({
            selectedTag: null
          });
          
          this.loadUserTags();
        } else {
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('保存标签失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      }
    });
  },

  // 页面刷新
  onPullDownRefresh: function() {
    this.loadUserTags();
    this.loadRecommendedTags();
    this.loadTagHistory();
    this.loadTagStatistics();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
}); 