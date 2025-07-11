// pages/order-detail/order-detail.js
Page({
  data: {
    order: null,
    statusText: {
      'pending': '待处理',
      'processing': '制作中',
      'completed': '已完成',
      'cancelled': '已取消'
    },
    statusDesc: {
      'pending': '您的订单已提交，请耐心等待',
      'processing': '您的订单正在制作中',
      'completed': '您的订单已完成，请及时取餐',
      'cancelled': '您的订单已取消'
    }
  },

  onLoad(options) {
    const { orderNo } = options
    if (orderNo) {
      this.loadOrderDetail(orderNo)
    }
  },

  // 加载订单详情
  loadOrderDetail(orderNo) {
    wx.showLoading({
      title: '加载中...'
    })

    const app = getApp()
    
    // 使用API调用获取订单详情
    app.request({
      url: `/orders/${orderNo}`,
      method: 'GET'
    }).then(res => {
      wx.hideLoading()
      if (res.success) {
        // 格式化时间和数据
        const order = res.data
        const createTime = this.formatDateTime(order.created_at || order.createTime)
        const pickupTime = order.pickup_time || order.pickupTime
        
        this.setData({
          order: {
            ...order,
            createTime,
            pickupTime: pickupTime ? this.formatDateTime(pickupTime) : '',
            // 确保items字段存在
            items: order.items || []
          }
        })
      } else {
        wx.showToast({
          title: res.message || '订单不存在',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('加载订单详情失败', err)
      wx.showToast({
        title: '网络错误，正在尝试本地加载',
        icon: 'none'
      })
      
      // 如果API调用失败，尝试从本地存储获取
      this.loadLocalOrderDetail(orderNo)
    })
  },

  // 从本地存储加载订单详情（后备方案）
  loadLocalOrderDetail(orderNo) {
    const orders = wx.getStorageSync('orders') || []
    const order = orders.find(item => item.orderNo === orderNo)
    
    if (order) {
      // 格式化时间
      const createTime = this.formatDateTime(order.createTime)
      
      this.setData({
        order: {
          ...order,
          createTime
        }
      })
    } else {
      wx.showToast({
        title: '订单不存在',
        icon: 'none'
      })
    }
  },

  // 格式化日期时间
  formatDateTime(timeString) {
    const date = new Date(timeString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
}) 