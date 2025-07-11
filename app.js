// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功', res.code)
      }
    })

    // 初始化购物车
    if (!wx.getStorageSync('cart')) {
      wx.setStorageSync('cart', [])
    }

    // 初始化API基础URL
    this.globalData.apiBase = 'http://192.168.110.82:3000/api'
  },

  globalData: {
    userInfo: null,
    apiBase: '',
    cart: [],
    orderInfo: {}
  },

  // 全局方法：获取购物车
  getCart() {
    return wx.getStorageSync('cart') || []
  },

  // 全局方法：设置购物车
  setCart(cart) {
    wx.setStorageSync('cart', cart)
    this.globalData.cart = cart
  },

  // 全局方法：添加商品到购物车
  addToCart(product) {
    let cart = this.getCart()
    const existIndex = cart.findIndex(item => item.id === product.id)
    
    if (existIndex >= 0) {
      cart[existIndex].quantity += 1
    } else {
      cart.push({
        ...product,
        quantity: 1
      })
    }
    
    this.setCart(cart)
    
    wx.showToast({
      title: '已添加到购物车',
      icon: 'success'
    })
  },

  // 全局方法：获取购物车总数量
  getCartCount() {
    const cart = this.getCart()
    return cart.reduce((total, item) => total + item.quantity, 0)
  },

  // 全局方法：获取购物车总价
  getCartTotal() {
    const cart = this.getCart()
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  },

  // 全局方法：API请求封装
  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiBase}${options.url}`,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(res)
          }
        },
        fail: (error) => {
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          })
          reject(error)
        }
      })
    })
  }
})
