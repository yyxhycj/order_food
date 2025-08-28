// pages/orders/orders.js
Page({
  data: {
    requests: [],
    statusText: {
      'pending': '待处理',
      'processing': '处理中',
      'completed': '已完成',
      'cancelled': '已取消'
    }
  },

  onShow() {
    this.loadRequests()
  },

  // 加载请求列表
  loadRequests() {
    wx.showLoading({
      title: '加载中...'
    })

    const app = getApp()
    
    // 使用API调用获取请求数据
    app.request({
      url: '/requests',
      method: 'GET'
    }).then(res => {
      wx.hideLoading()
      if (res.success) {
        // 处理请求数据，添加总数量和格式化时间
        const processedRequests = res.data.map(request => {
          const totalQuantity = request.items ? request.items.reduce((total, item) => total + item.quantity, 0) : 0
          const createTime = this.formatTime(request.created_at || request.createTime)
          
          return {
            ...request,
            totalQuantity,
            createTime: createTime
          }
        })

        this.setData({
          requests: processedRequests
        })
      } else {
        wx.showToast({
          title: res.message || '加载请求失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('加载请求失败', err)
      wx.showToast({
        title: '网络错误，请检查网络连接',
        icon: 'none'
      })
      
      // 如果API调用失败，尝试使用本地存储作为后备
      this.loadLocalRequests()
    })
  },

  // 加载本地请求（后备方案）
  loadLocalRequests() {
    const requests = wx.getStorageSync('requests') || []
    
    // 处理请求数据，添加总数量和格式化时间
    const processedRequests = requests.map(request => {
      const totalQuantity = request.items.reduce((total, item) => total + item.quantity, 0)
      const createTime = this.formatTime(request.createTime)
      
      return {
        ...request,
        totalQuantity,
        createTime
      }
    })

    this.setData({
      requests: processedRequests
    })
  },

  // 格式化时间
  formatTime(timeString) {
    const date = new Date(timeString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${month}-${day} ${hours}:${minutes}`
  },

  // 跳转到请求详情
  goToRequestDetail(e) {
    const requestNo = e.currentTarget.dataset.requestNo
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?requestNo=${requestNo}`
    })
  },

  // 跳转到菜单页面
  goToMenu() {
    wx.switchTab({
      url: '/pages/menu/menu'
    })
  }
}) 