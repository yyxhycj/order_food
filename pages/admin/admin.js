// pages/admin/admin.js
const app = getApp()

Page({
  data: {
    currentDate: '',
    todayStats: {
      orderCount: 0,
      productCount: 0,
      pendingCount: 0
    },
    recentOrders: []
  },

  onLoad: function (options) {
    this.setCurrentDate()
    this.loadData()
  },

  onShow: function () {
    this.loadData()
  },

  // 设置当前日期
  setCurrentDate: function () {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekday = weekdays[now.getDay()]
    
    this.setData({
      currentDate: `${year}-${month}-${day} 星期${weekday}`
    })
  },

  // 加载数据
  loadData: function () {
    this.loadTodayStats()
    this.loadRecentOrders()
  },

  // 加载今日统计
  loadTodayStats: function () {
    // 获取今日订单统计
    app.request({
      url: '/orders/stats/today',
      method: 'GET'
    }).then(res => {
      if (res.success && res.data) {
        this.setData({
          'todayStats.orderCount': res.data.total_orders || 0,
          'todayStats.pendingCount': res.data.pending_count || 0
        })
      }
    }).catch(error => {
      console.error('获取今日订单统计失败:', error)
    })

    // 获取商品统计
    app.request({
      url: '/products/stats',
      method: 'GET'
    }).then(res => {
      if (res.success && res.data) {
        this.setData({
          'todayStats.productCount': res.data.total || 0
        })
      }
    }).catch(error => {
      console.error('获取商品统计失败:', error)
    })
  },

  // 加载最新订单
  loadRecentOrders: function () {
    app.request({
      url: '/orders',
      method: 'GET',
      data: {
        limit: 5
      }
    }).then(res => {
      if (res.success && res.data) {
        const recentOrders = res.data.map(order => ({
          ...order,
          statusText: this.getStatusText(order.status),
          createTime: this.formatTime(order.created_at)
        }))

        this.setData({
          recentOrders
        })
      }
    }).catch(error => {
      console.error('获取最新订单失败:', error)
      // 如果API调用失败，设置空数组
      this.setData({
        recentOrders: []
      })
    })
  },

  // 获取状态文本
  getStatusText: function (status) {
    const statusMap = {
      'pending': '待处理',
      'processing': '制作中',
      'completed': '已完成',
      'cancelled': '已取消'
    }
    return statusMap[status] || '未知状态'
  },

  // 格式化时间
  formatTime: function (timestamp) {
    // 如果是字符串类型的日期，直接处理
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp)
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    }
    
    // 如果是数字类型的时间戳
    const date = new Date(timestamp)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  },

  // 跳转到订单管理
  goToOrders: function () {
    wx.navigateTo({
      url: '/pages/admin/orders/orders'
    })
  },

  // 跳转到菜单管理
  goToMenu: function () {
    wx.navigateTo({
      url: '/pages/admin/menu/menu'
    })
  },

  // 跳转到分类管理 (现在已合并到菜单管理)
  goToCategories: function () {
    wx.navigateTo({
      url: '/pages/admin/menu/menu'
    })
  },

  // 跳转到订单详情
  goToOrderDetail: function (e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  // 刷新数据
  refreshData: function () {
    wx.showLoading({
      title: '刷新中...'
    })
    
    this.loadData()
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    }, 1000)
  }
})