// pages/menu/menu.js
const app = getApp()

Page({
  data: {
    // 店铺信息
    storeName: '点单小程序',
    storeSubtitle: '(示例店铺)',
    storeRating: '4.6',
    monthSales: '2123',
    deliveryTime: '30',
    distance: '0.65',
    promotionMin: '20',
    promotionSave: '5',
    itemCount: 0,
    categoryCount: 0,
    ratingPercent: '94',
    

    
    // 分类和商品
    currentCategory: 0,
    categories: [
      { id: 0, name: '全部', count: 0 }
    ],
    products: [],
    categorizedProducts: [],
    filteredProducts: [],
    cartCount: 0,
    cartTotal: 0
  },

  onLoad(options) {
    // 获取从首页传递的分类ID
    if (options.category) {
      this.setData({
        currentCategory: parseInt(options.category)
      })
    }
    
    this.loadCategories()
    this.loadProducts()
  },

  onShow() {
    this.updateCartInfo()
  },

  // 加载分类
  loadCategories() {
    app.request({
      url: '/categories',
      method: 'GET'
    }).then(res => {
      if (res.success && res.data) {
        const categories = [
          { id: 0, name: '全部', count: 0 },
          ...res.data.map(item => ({
            id: item.id,
            name: item.name,
            count: 0
          }))
        ]
        this.setData({ 
          categories,
          categoryCount: res.data.length
        })
      }
    }).catch(error => {
      console.error('加载分类失败:', error)
      wx.showToast({
        title: '加载分类失败',
        icon: 'none'
      })
      // 设置最基础的分类
      this.setData({ 
        categories: [{ id: 0, name: '全部', count: 0 }],
        categoryCount: 0
      })
    })
  },

  // 加载商品
  loadProducts() {
    app.request({
      url: '/products',
      method: 'GET'
    }).then(res => {
      if (res.success && res.data) {
        const products = res.data.map(item => ({
          ...item,
          cartQuantity: 0,
          rating: (4.0 + Math.random() * 1.0).toFixed(1),
          ratingPercent: Math.floor(85 + Math.random() * 15)
        }))
        
        this.setData({ 
          products,
          itemCount: products.length
        })
        
        this.updateCartQuantities()
        this.filterProducts()
        this.updateCategoryCounts()
      }
    }).catch(error => {
      console.error('加载商品失败:', error)
      wx.showToast({
        title: '加载商品失败',
        icon: 'none'
      })
      // 设置空商品列表
      this.setData({ 
        products: [],
        itemCount: 0
      })
      this.updateCartQuantities()
      this.filterProducts()
      this.updateCategoryCounts()
    })
  },

  // 更新购物车数量
  updateCartQuantities() {
    const cart = app.globalData.cart || []
    const products = this.data.products.map(product => {
      const cartItem = cart.find(item => item.id === product.id)
      return {
        ...product,
        cartQuantity: cartItem ? cartItem.quantity : 0
      }
    })
    this.setData({ products })
  },

  // 筛选商品
  filterProducts() {
    const { products, currentCategory, categories } = this.data
    let filtered = products

    if (currentCategory !== 0) {
      filtered = products.filter(product => product.category_id === currentCategory)
    }

    // 按分类组织商品
    const categorizedProducts = []
    categories.forEach(category => {
      if (category.id === 0) return // 跳过"全部"分类
      
      const categoryProducts = products.filter(product => 
        product.category_id === category.id && 
        (currentCategory === 0 || product.category_id === currentCategory)
      )
      
      if (categoryProducts.length > 0) {
        categorizedProducts.push({
          categoryId: category.id,
          categoryName: category.name,
          products: categoryProducts
        })
      }
    })

    this.setData({ 
      filteredProducts: filtered,
      categorizedProducts
    })
  },

  // 更新分类商品数量
  updateCategoryCounts() {
    const { categories, products } = this.data
    const updatedCategories = categories.map(category => {
      if (category.id === 0) {
        return { ...category, count: products.length }
      }
      const count = products.filter(p => p.category_id === category.id).length
      return { ...category, count }
    })
    this.setData({ categories: updatedCategories })
  },

  // 更新购物车信息
  updateCartInfo() {
    const cart = app.globalData.cart || []
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    
    this.setData({ cartCount, cartTotal })
    this.updateCartQuantities()
    this.filterProducts()
  },





  // 切换分类
  onCategoryChange(e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({ currentCategory: categoryId })
    this.filterProducts()
  },

  // 添加到购物车
  addToCart(e) {
    const product = e.currentTarget.dataset.product
    const cart = app.globalData.cart || []
    
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      })
    }
    
    app.globalData.cart = cart
    this.updateCartInfo()
    
    wx.showToast({
      title: '已添加到购物车',
      icon: 'success'
    })
  },

  // 增加商品数量
  increaseQuantity(e) {
    const productId = e.currentTarget.dataset.id
    const cart = app.globalData.cart || []
    
    const existingItem = cart.find(item => item.id === productId)
    if (existingItem) {
      existingItem.quantity += 1
      app.globalData.cart = cart
      this.updateCartInfo()
    }
  },

  // 减少商品数量
  decreaseQuantity(e) {
    const productId = e.currentTarget.dataset.id
    const cart = app.globalData.cart || []
    
    const existingItem = cart.find(item => item.id === productId)
    if (existingItem) {
      if (existingItem.quantity > 1) {
        existingItem.quantity -= 1
      } else {
        const index = cart.findIndex(item => item.id === productId)
        cart.splice(index, 1)
      }
      app.globalData.cart = cart
      this.updateCartInfo()
    }
  },

  // 跳转到商品详情
  goToProduct(e) {
    const productId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/product?id=${productId}`
    })
  },

  // 跳转到购物车
  goToCart() {
    wx.switchTab({
      url: '/pages/cart/cart'
    })
  },

  // 跳转到下单页
  goToOrder() {
    wx.navigateTo({
      url: '/pages/order/order'
    })
  },

  // 长按店铺名称进入管理端
  onStoreLongPress() {
    wx.showModal({
      title: '管理员登录',
      content: '是否进入管理后台？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/admin/admin'
          })
        }
      }
    })
  }
}) 