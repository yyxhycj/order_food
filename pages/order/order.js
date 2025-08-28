// pages/order/order.js
const app = getApp()

Page({
  data: {
    wishListItems: [],
    requestReason: '',
    urgency: 'normal'
  },

  onLoad() {
    this.loadCartItems()
  },



  // 加载愿望清单菜品
  loadCartItems() {
    const wishListItems = app.getCart()

    if (wishListItems.length === 0) {
      wx.showToast({
        title: '愿望清单是空的',
        icon: 'none'
      })
      
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/menu/menu'
        })
      }, 1500)
      return
    }

    this.setData({
      wishListItems
    })
  },



  // 请求原因输入
  onReasonInput(e) {
    this.setData({
      requestReason: e.detail.value
    })
  },

  // 紧急程度选择
  onUrgencyChange(e) {
    this.setData({
      urgency: e.detail.value
    })
  },



  // 提交请求
  submitRequest() {
    wx.showLoading({
      title: '提交中...'
    })

    // 生成请求数据，适配API格式
    const requestData = {
      request_reason: this.data.requestReason,
      urgency: this.data.urgency,
      items: this.data.wishListItems.map(item => ({
        dish_id: item.id,
        dish_name: item.dish_name || item.name,
        quantity: item.quantity
      }))
    }

    // 使用API调用提交请求
    app.request({
      url: '/requests',
      method: 'POST',
      data: requestData
    }).then(res => {
      wx.hideLoading()
      if (res.success) {
        // 清空购物车
        app.setCart([])
        
        wx.showToast({
          title: '请求提交成功',
          icon: 'success'
        })

        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/order-detail/order-detail?requestNo=${res.data.request_no}`
          })
        }, 1500)
      } else {
        wx.showToast({
          title: res.message || '提交失败，请重试',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('提交请求失败', err)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
      
      // 如果API调用失败，使用本地存储作为后备
      this.submitRequestLocally()
    })
  },

  // 本地提交请求（后备方案）
  submitRequestLocally() {
    wx.showLoading({
      title: '本地保存中...'
    })

    const requestData = {
      requestNo: this.generateRequestNo(),
      items: this.data.wishListItems.map(item => ({
        dishId: item.id,
        name: item.dish_name || item.name,
        quantity: item.quantity
      })),
      requestReason: this.data.requestReason,
      urgency: this.data.urgency,
      status: 'pending',
      createTime: new Date().toISOString()
    }

    setTimeout(() => {
      wx.hideLoading()
      
      // 保存请求到本地
      this.saveRequestToLocal(requestData)
      
      // 清空购物车
      app.setCart([])
      
      wx.showToast({
        title: '请求已本地保存',
        icon: 'success'
      })

      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order-detail/order-detail?requestNo=${requestData.requestNo}`
        })
      }, 1500)
    }, 1000)
  },

  // 生成请求号
  generateRequestNo() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    const second = String(now.getSeconds()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `${year}${month}${day}${hour}${minute}${second}${random}`
  },

  // 保存请求到本地存储
  saveRequestToLocal(requestData) {
    let requests = wx.getStorageSync('requests') || []
    requests.unshift(requestData)
    wx.setStorageSync('requests', requests)
  }
}) 