// pages/orders/orders.js
Page({
  data: {
    orders: [],
    statusText: {
      'pending': '待处理',
      'processing': '制作中',
      'completed': '已完成',
      'cancelled': '已取消'
    }
  },

  onShow() {
    this.loadOrders()
  },

  // 加载订单列表
  loadOrders() {
    wx.showLoading({
      title: '加载中...'
    })

    const app = getApp()
    
    // 使用API调用获取订单数据
    app.request({
      url: '/orders',
      method: 'GET'
    }).then(res => {
      wx.hideLoading()
      if (res.success) {
        // 处理订单数据，添加总数量和格式化时间
        const processedOrders = res.data.map(order => {
          const totalQuantity = order.items ? order.items.reduce((total, item) => total + item.quantity, 0) : 0
          const createTime = this.formatTime(order.created_at || order.createTime)
          
          return {
            ...order,
            totalQuantity,
            createTime: createTime
          }
        })

        this.setData({
          orders: processedOrders
        })
      } else {
        wx.showToast({
          title: res.message || '加载订单失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('加载订单失败', err)
      wx.showToast({
        title: '网络错误，请检查网络连接',
        icon: 'none'
      })
      
      // 如果API调用失败，尝试使用本地存储作为后备
      this.loadLocalOrders()
    })
  },

  // 加载本地订单（后备方案）
  loadLocalOrders() {
    const orders = wx.getStorageSync('orders') || []
    
    // 处理订单数据，添加总数量和格式化时间
    const processedOrders = orders.map(order => {
      const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0)
      const createTime = this.formatTime(order.createTime)
      
      return {
        ...order,
        totalQuantity,
        createTime
      }
    })

    this.setData({
      orders: processedOrders
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

  // 跳转到订单详情
  goToOrderDetail(e) {
    const orderNo = e.currentTarget.dataset.orderNo
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderNo=${orderNo}`
    })
  },

  // 跳转到菜单页面
  goToMenu() {
    wx.switchTab({
      url: '/pages/menu/menu'
    })
  }
}) 