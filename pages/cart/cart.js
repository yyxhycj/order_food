// pages/cart/cart.js
const app = getApp()

Page({
  data: {
    cartItems: [],
    totalQuantity: 0,
    totalAmount: 0
  },

  onShow() {
    this.loadCartItems()
  },

  // 加载购物车商品
  loadCartItems() {
    const cartItems = app.getCart()
    const totalQuantity = app.getCartCount()
    const totalAmount = app.getCartTotal()

    this.setData({
      cartItems,
      totalQuantity,
      totalAmount
    })
  },

  // 增加商品数量
  increaseQuantity(e) {
    const productId = e.currentTarget.dataset.id
    const cartItems = this.data.cartItems
    const item = cartItems.find(item => item.id === productId)
    
    if (item) {
      app.addToCart(item)
      this.loadCartItems()
    }
  },

  // 减少商品数量
  decreaseQuantity(e) {
    const productId = e.currentTarget.dataset.id
    let cart = app.getCart()
    
    const itemIndex = cart.findIndex(item => item.id === productId)
    if (itemIndex >= 0) {
      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1
      } else {
        cart.splice(itemIndex, 1)
      }
      
      app.setCart(cart)
      this.loadCartItems()
    }
  },

  // 移除商品
  removeItem(e) {
    const productId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要从购物车中移除这个商品吗？',
      success: (res) => {
        if (res.confirm) {
          let cart = app.getCart()
          cart = cart.filter(item => item.id !== productId)
          app.setCart(cart)
          this.loadCartItems()
          
          wx.showToast({
            title: '已移除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 跳转到菜单页面
  goToMenu() {
    wx.switchTab({
      url: '/pages/menu/menu'
    })
  },

  // 跳转到下单页面
  goToOrder() {
    if (this.data.cartItems.length === 0) {
      wx.showToast({
        title: '购物车是空的',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/order/order'
    })
  }
}) 