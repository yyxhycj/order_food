// pages/order/order.js
const app = getApp()

Page({
  data: {
    cartItems: [],
    totalAmount: 0,
    remark: ''
  },

  onLoad() {
    this.loadCartItems()
  },



  // 加载购物车商品
  loadCartItems() {
    const cartItems = app.getCart()
    const totalAmount = app.getCartTotal()

    if (cartItems.length === 0) {
      wx.showToast({
        title: '购物车是空的',
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
      cartItems,
      totalAmount
    })
  },



  // 备注输入
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },



  // 提交订单
  submitOrder() {
    wx.showLoading({
      title: '提交中...'
    })

    // 生成订单数据，适配API格式
    const orderData = {
      remark: this.data.remark,
      items: this.data.cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    }

    // 使用API调用提交订单
    app.request({
      url: '/orders',
      method: 'POST',
      data: orderData
    }).then(res => {
      wx.hideLoading()
      if (res.success) {
        // 清空购物车
        app.setCart([])
        
        wx.showToast({
          title: '订单提交成功',
          icon: 'success'
        })

        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/order-detail/order-detail?orderNo=${res.data.order_no}`
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
      console.error('提交订单失败', err)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
      
      // 如果API调用失败，使用本地存储作为后备
      this.submitOrderLocally()
    })
  },

  // 本地提交订单（后备方案）
  submitOrderLocally() {
    wx.showLoading({
      title: '本地保存中...'
    })

    const orderData = {
      orderNo: this.generateOrderNo(),
      items: this.data.cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      })),
      totalAmount: this.data.totalAmount,
      remark: this.data.remark,
      status: 'pending',
      createTime: new Date().toISOString()
    }

    setTimeout(() => {
      wx.hideLoading()
      
      // 保存订单到本地
      this.saveOrderToLocal(orderData)
      
      // 清空购物车
      app.setCart([])
      
      wx.showToast({
        title: '订单已本地保存',
        icon: 'success'
      })

      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order-detail/order-detail?orderNo=${orderData.orderNo}`
        })
      }, 1500)
    }, 1000)
  },

  // 生成订单号
  generateOrderNo() {
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

  // 保存订单到本地存储
  saveOrderToLocal(orderData) {
    let orders = wx.getStorageSync('orders') || []
    orders.unshift(orderData)
    wx.setStorageSync('orders', orders)
  }
}) 