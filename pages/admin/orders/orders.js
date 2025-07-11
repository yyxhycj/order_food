// pages/admin/orders/orders.js
const app = getApp()

Page({
  data: {
    currentStatus: 'all',
    statusOptions: [
      { value: 'all', label: '全部', count: 0 },
      { value: 'pending', label: '待处理', count: 0 },
      { value: 'processing', label: '制作中', count: 0 },
      { value: 'completed', label: '已完成', count: 0 },
      { value: 'cancelled', label: '已取消', count: 0 }
    ],
    orders: [],
    filteredOrders: [],
    showDetailModal: false,
    selectedOrder: null
  },

  onLoad: function (options) {
    this.loadOrders()
  },

  onShow: function () {
    this.loadOrders()
  },

  // 加载订单列表
  loadOrders: function () {
    app.request({
      url: '/orders',
      method: 'GET'
    }).then(res => {
      if (res.success && res.data) {
        // 格式化订单数据
        const formattedOrders = res.data.map(order => ({
          ...order,
          statusText: this.getStatusText(order.status),
          createTime: this.formatDateTime(order.created_at),
          pickupTime: order.pickup_time ? this.formatDateTime(order.pickup_time) : ''
        }))

        this.setData({
          orders: formattedOrders
        })

        this.updateStatusCounts()
        this.filterOrders()
      }
    }).catch(error => {
      console.error('加载订单失败:', error)
      wx.showToast({
        title: '加载订单失败',
        icon: 'none'
      })
      // 如果API调用失败，设置空数组
      this.setData({
        orders: []
      })
      this.updateStatusCounts()
      this.filterOrders()
    })
  },

  // 更新状态统计
  updateStatusCounts: function () {
    const { orders } = this.data
    const statusCounts = {}
    
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
    })

    const statusOptions = this.data.statusOptions.map(option => ({
      ...option,
      count: option.value === 'all' ? orders.length : (statusCounts[option.value] || 0)
    }))

    this.setData({
      statusOptions
    })
  },

  // 筛选订单
  filterOrders: function () {
    const { orders, currentStatus } = this.data
    let filteredOrders = orders

    if (currentStatus !== 'all') {
      filteredOrders = orders.filter(order => order.status === currentStatus)
    }

    this.setData({
      filteredOrders
    })
  },

  // 状态切换
  onStatusChange: function (e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentStatus: status
    })
    this.filterOrders()
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

  // 格式化日期时间
  formatDateTime: function (timestamp) {
    // 如果是字符串类型的日期，直接处理
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }
    
    // 如果是数字类型的时间戳
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  },

  // 刷新订单
  refreshOrders: function () {
    wx.showLoading({
      title: '刷新中...'
    })
    
    this.loadOrders()
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    }, 1000)
  },

  // 查看订单详情
  viewOrderDetail: function (e) {
    const orderId = e.currentTarget.dataset.id
    
    // 从API获取订单详情
    app.request({
      url: `/orders/${orderId}`,
      method: 'GET'
    }).then(res => {
      if (res.success && res.data) {
        const order = {
          ...res.data,
          statusText: this.getStatusText(res.data.status),
          createTime: this.formatDateTime(res.data.created_at),
          pickupTime: res.data.pickup_time ? this.formatDateTime(res.data.pickup_time) : ''
        }
        
        this.setData({
          selectedOrder: order,
          showDetailModal: true
        })
      }
    }).catch(error => {
      console.error('获取订单详情失败:', error)
      wx.showToast({
        title: '获取订单详情失败',
        icon: 'none'
      })
    })
  },

  // 隐藏详情弹窗
  hideDetailModal: function () {
    this.setData({
      showDetailModal: false,
      selectedOrder: null
    })
  },

  // 阻止弹窗关闭
  preventClose: function () {
    // 阻止事件冒泡
  },

  // 接单
  acceptOrder: function (e) {
    const orderId = e.currentTarget.dataset.id
    this.updateOrderStatus(orderId, 'processing', '已接单，开始制作')
  },

  // 完成订单
  completeOrder: function (e) {
    const orderId = e.currentTarget.dataset.id
    this.updateOrderStatus(orderId, 'completed', '订单已完成')
  },

  // 取消订单
  cancelOrder: function (e) {
    const orderId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus(orderId, 'cancelled', '订单已取消')
        }
      }
    })
  },

  // 从弹窗中接单
  acceptOrderFromModal: function (e) {
    const orderId = e.currentTarget.dataset.id
    this.updateOrderStatus(orderId, 'processing', '已接单，开始制作')
    this.hideDetailModal()
  },

  // 从弹窗中完成订单
  completeOrderFromModal: function (e) {
    const orderId = e.currentTarget.dataset.id
    this.updateOrderStatus(orderId, 'completed', '订单已完成')
    this.hideDetailModal()
  },

  // 更新订单状态
  updateOrderStatus: function (orderId, newStatus, message) {
    app.request({
      url: `/orders/${orderId}/status`,
      method: 'PUT',
      data: {
        status: newStatus
      }
    }).then(res => {
      if (res.success) {
        wx.showToast({
          title: message,
          icon: 'success'
        })
        
        // 重新加载订单列表
        this.loadOrders()
      }
    }).catch(error => {
      console.error('更新订单状态失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  // 跳转到订单详情页
  goToOrderDetail: function (e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  }
})