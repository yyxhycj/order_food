// pages/reminders/list/list.js
const app = getApp()

Page({
  data: {
    reminders: [],
    loading: false,
    hasMore: true,
    currentPage: 1,
    unreadCount: 0
  },

  onLoad: function (options) {
    this.loadReminders()
  },

  onShow: function () {
    this.loadReminders()
  },

  // 加载提醒列表
  loadReminders: function () {
    if (this.data.loading) return

    this.setData({ loading: true })

    app.request({
      url: '/reminders/admin',
      method: 'GET',
      data: {
        page: this.data.currentPage,
        limit: 20
      }
    }).then(res => {
      if (res.success && res.data) {
        const newReminders = res.data.reminders.map(reminder => ({
          ...reminder,
          createTime: this.formatDateTime(reminder.created_at),
          timeAgo: this.getTimeAgo(reminder.created_at)
        }))

        this.setData({
          reminders: this.data.currentPage === 1 ? newReminders : 
                    this.data.reminders.concat(newReminders),
          unreadCount: res.data.unreadCount,
          hasMore: newReminders.length >= 20,
          loading: false
        })
      }
    }).catch(error => {
      console.error('加载提醒列表失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    })
  },

  // 标记单个提醒为已读
  markAsRead: function (e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index

    app.request({
      url: `/reminders/${id}/read`,
      method: 'PATCH'
    }).then(res => {
      if (res.success) {
        const reminders = this.data.reminders
        reminders[index].status = 'read'
        
        this.setData({
          reminders,
          unreadCount: Math.max(0, this.data.unreadCount - 1)
        })

        wx.showToast({
          title: '已标记为已读',
          icon: 'success'
        })
      }
    }).catch(error => {
      console.error('标记已读失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  // 全部标记为已读
  markAllAsRead: function () {
    const unreadIds = this.data.reminders
      .filter(reminder => reminder.status !== 'read')
      .map(reminder => reminder.id)

    if (unreadIds.length === 0) {
      wx.showToast({
        title: '没有未读提醒',
        icon: 'none'
      })
      return
    }

    app.request({
      url: '/reminders/batch/read',
      method: 'POST',
      data: { ids: unreadIds }
    }).then(res => {
      if (res.success) {
        const reminders = this.data.reminders.map(reminder => ({
          ...reminder,
          status: 'read'
        }))

        this.setData({
          reminders,
          unreadCount: 0
        })

        wx.showToast({
          title: '全部已标记为已读',
          icon: 'success'
        })
      }
    }).catch(error => {
      console.error('批量标记已读失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  // 跳转到订单详情
  goToOrderDetail: function (e) {
    const orderId = e.currentTarget.dataset.orderId
    if (orderId) {
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${orderId}`
      })
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.setData({
      currentPage: 1,
      hasMore: true
    })
    this.loadReminders()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        currentPage: this.data.currentPage + 1
      })
      this.loadReminders()
    }
  },

  // 格式化时间
  formatDateTime: function (timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  },

  // 计算时间差
  getTimeAgo: function (timestamp) {
    const now = new Date()
    const past = new Date(timestamp)
    const diff = now - past
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    return '很久之前'
  }
})