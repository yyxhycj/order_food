// pages/cart/cart.js
const app = getApp()

Page({
  data: {
    wishList: [],
    totalQuantity: 0
  },

  onShow() {
    this.loadWishList()
  },

  // 加载愿望清单
  loadWishList() {
    const wishList = app.getCart()
    const totalQuantity = app.getCartCount()

    this.setData({
      wishList,
      totalQuantity
    })
  },

  // 增加菜品数量
  increaseQuantity(e) {
    const dishId = e.currentTarget.dataset.id
    const wishList = this.data.wishList
    const item = wishList.find(item => item.id === dishId)
    
    if (item) {
      app.addToCart(item)
      this.loadWishList()
    }
  },

  // 减少菜品数量
  decreaseQuantity(e) {
    const dishId = e.currentTarget.dataset.id
    let cart = app.getCart()
    
    const itemIndex = cart.findIndex(item => item.id === dishId)
    if (itemIndex >= 0) {
      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1
      } else {
        cart.splice(itemIndex, 1)
      }
      
      app.setCart(cart)
      this.loadWishList()
    }
  },

  // 移除菜品
  removeItem(e) {
    const dishId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要从愿望清单中移除这个菜品吗？',
      success: (res) => {
        if (res.confirm) {
          let cart = app.getCart()
          cart = cart.filter(item => item.id !== dishId)
          app.setCart(cart)
          this.loadWishList()
          
          wx.showToast({
            title: '已移除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 跳转到菜品页面
  goToMenu() {
    wx.switchTab({
      url: '/pages/menu/menu'
    })
  },

  // 提交请求
  goToRequest() {
    if (this.data.wishList.length === 0) {
      wx.showToast({
        title: '愿望清单是空的',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/order/order'
    })
  }
}) 