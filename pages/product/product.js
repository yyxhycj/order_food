// pages/product/product.js
const app = getApp()

Page({
  data: {
    product: null,
    selectedSpec: 0,
    quantity: 1,
    cartCount: 0
  },

  onLoad: function (options) {
    const productId = options.id
    if (productId) {
      this.loadProduct(productId)
    }
    this.updateCartCount()
  },

  onShow: function () {
    this.updateCartCount()
  },

  // 加载商品详情
  loadProduct: function (productId) {
    app.request({
      url: `/products/${productId}`,
      method: 'GET'
    }).then(res => {
      if (res.success && res.data) {
        // 为商品添加默认规格选项（如果没有的话）
        const product = {
          ...res.data,
          specs: res.data.specs || [
            { name: "标准", price: 0 }
          ]
        }
        
        this.setData({
          product: product
        })
      }
    }).catch(error => {
      console.error('加载商品详情失败:', error)
      wx.showToast({
        title: '加载商品详情失败',
        icon: 'none'
      })
      // 返回上一页或菜单页
      wx.navigateBack({
        fail: () => {
          wx.switchTab({
            url: '/pages/menu/menu'
          })
        }
      })
    })
  },

  // 选择规格
  selectSpec: function (e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      selectedSpec: index
    })
  },

  // 减少数量
  decreaseQuantity: function () {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      })
    }
  },

  // 增加数量
  increaseQuantity: function () {
    this.setData({
      quantity: this.data.quantity + 1
    })
  },

  // 加入购物车
  addToCart: function () {
    const { product, selectedSpec, quantity } = this.data
    
    if (!product) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none'
      })
      return
    }

    // 计算价格
    let totalPrice = product.price
    if (product.specs && product.specs[selectedSpec]) {
      totalPrice += product.specs[selectedSpec].price
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      price: totalPrice,
      image: product.image,
      quantity: quantity,
      spec: product.specs ? product.specs[selectedSpec] : null
    }

    // 调用全局方法添加到购物车
    app.addToCart(cartItem)
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })

    this.updateCartCount()
  },

  // 更新购物车数量
  updateCartCount: function () {
    const cartCount = app.getCartCount()
    this.setData({
      cartCount: cartCount
    })
  },

  // 跳转到购物车
  goToCart: function () {
    wx.switchTab({
      url: '/pages/cart/cart'
    })
  }
})