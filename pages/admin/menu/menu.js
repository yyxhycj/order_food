// pages/admin/menu/menu.js
const app = getApp()

Page({
  data: {
    currentCategory: 0,
    categories: [
      { id: 0, name: '全部' }
    ],
    categoryOptions: [],
    products: [],
    filteredProducts: [],
    
    // 分类管理相关
    showCategoryModal: false,
    isCategoryEdit: false,
    categoryFormData: {
      name: '',
      description: '',
      sort: '',
      icon: ''
    },
    editingCategoryId: null,
    iconOptions: [
      '/images/category-all.png',
      '/images/category-drink.png',
      '/images/category-food.png',
      '/images/category-dessert.png'
    ],
    
    // 商品管理相关
    showProductModal: false,
    isProductEdit: false,
    productFormData: {
      name: '',
      description: '',
      categoryIndex: 0,
      image: ''
    },
    editingProductId: null
  },

  onLoad: function (options) {
    this.loadCategories()
    this.loadProducts()
  },

  onShow: function () {
    this.loadCategories()
    this.loadProducts()
  },

  // 加载分类数据
  loadCategories: function () {
    app.request({
      url: '/categories',
      method: 'GET'
    }).then(res => {
      if (res.success && res.data) {
        // 获取商品数据来统计每个分类的商品数量
        app.request({
          url: '/products',
          method: 'GET'
        }).then(productRes => {
          const products = productRes.success ? productRes.data : []
          
          const categoriesWithCount = res.data.map(category => ({
            ...category,
            productCount: products.filter(p => p.category_id === category.id).length
          }))

          // 按排序字段排序
          categoriesWithCount.sort((a, b) => a.sort - b.sort)

          const categories = [{ id: 0, name: '全部' }].concat(categoriesWithCount)
          
          this.setData({
            categories,
            categoryOptions: categoriesWithCount.map(cat => ({
              id: cat.id,
              name: cat.name
            }))
          })
        }).catch(error => {
          console.error('获取商品数据失败:', error)
          // 仍然显示分类，但商品数量为0
          const categoriesWithCount = res.data.map(category => ({
            ...category,
            productCount: 0
          }))

          categoriesWithCount.sort((a, b) => a.sort - b.sort)
          const categories = [{ id: 0, name: '全部' }].concat(categoriesWithCount)
          
          this.setData({
            categories,
            categoryOptions: categoriesWithCount.map(cat => ({
              id: cat.id,
              name: cat.name
            }))
          })
        })
      }
    }).catch(error => {
      console.error('加载分类失败:', error)
      wx.showToast({
        title: '加载分类失败',
        icon: 'none'
      })
    })
  },

  // 加载商品列表
  loadProducts: function () {
    app.request({
      url: '/products',
      method: 'GET'
    }).then(res => {
      if (res.success && res.data) {
        // 适配后端数据格式到前端格式
        const products = res.data.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          image: product.image || '',
          category: product.category_id,
          status: product.status
        }))
        
        this.setData({
          products: products
        })
        this.filterProducts()
      }
    }).catch(error => {
      console.error('加载商品失败:', error)
      wx.showToast({
        title: '加载商品失败',
        icon: 'none'
      })
      // 如果API调用失败，设置空数组
      this.setData({
        products: []
      })
      this.filterProducts()
    })
  },

  // 筛选商品
  filterProducts: function () {
    const { products, currentCategory } = this.data
    let filteredProducts = products

    if (currentCategory !== 0) {
      filteredProducts = products.filter(product => product.category === currentCategory)
    }

    this.setData({
      filteredProducts
    })
  },

  // 分类切换
  onCategoryChange: function (e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({
      currentCategory: categoryId
    })
    this.filterProducts()
  },

  // ========== 分类管理方法 ==========

  // 显示添加分类弹窗
  showAddCategoryModal: function () {
    this.setData({
      showCategoryModal: true,
      isCategoryEdit: false,
      categoryFormData: {
        name: '',
        description: '',
        sort: '',
        icon: this.data.iconOptions[0]
      }
    })
  },

  // 编辑分类
  editCategory: function (e) {
    const category = e.currentTarget.dataset.category
    
    this.setData({
      showCategoryModal: true,
      isCategoryEdit: true,
      editingCategoryId: category.id,
      categoryFormData: {
        name: category.name,
        description: category.description || '',
        sort: category.sort.toString(),
        icon: category.icon || this.data.iconOptions[0]
      }
    })
  },

  // 隐藏分类弹窗
  hideCategoryModal: function () {
    this.setData({
      showCategoryModal: false
    })
  },

  // 分类输入框变化
  onCategoryInputChange: function (e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`categoryFormData.${field}`]: value
    })
  },

  // 选择图标
  selectIcon: function (e) {
    const icon = e.currentTarget.dataset.icon
    this.setData({
      'categoryFormData.icon': icon
    })
  },

  // 保存分类
  saveCategory: function () {
    const { categoryFormData, isCategoryEdit, editingCategoryId } = this.data
    
    // 验证表单
    if (!categoryFormData.name.trim()) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      })
      return
    }
    
    if (!categoryFormData.sort || categoryFormData.sort < 0) {
      wx.showToast({
        title: '请输入正确的排序数字',
        icon: 'none'
      })
      return
    }

    // 检查分类名称是否重复（在当前已加载的分类中检查）
    const existingCategory = this.data.categories.find(cat => 
      cat.name.trim() === categoryFormData.name.trim() && 
      cat.id !== 0 && // 排除"全部"选项
      (!isCategoryEdit || cat.id !== editingCategoryId)
    )
    
    if (existingCategory) {
      wx.showToast({
        title: '分类名称已存在',
        icon: 'none'
      })
      return
    }

    // 准备API数据
    const categoryData = {
      name: categoryFormData.name.trim(),
      description: categoryFormData.description.trim(),
      sort: parseInt(categoryFormData.sort),
      icon: categoryFormData.icon
    }
    
    if (isCategoryEdit) {
      // 编辑分类
      app.request({
        url: `/categories/${editingCategoryId}`,
        method: 'PUT',
        data: categoryData
      }).then(res => {
        if (res.success) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          this.setData({
            showCategoryModal: false
          })
          this.loadCategories()
        }
      }).catch(error => {
        console.error('保存分类失败:', error)
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      })
    } else {
      // 添加新分类
      app.request({
        url: '/categories',
        method: 'POST',
        data: categoryData
      }).then(res => {
        if (res.success) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          })
          this.setData({
            showCategoryModal: false
          })
          this.loadCategories()
        }
      }).catch(error => {
        console.error('添加分类失败:', error)
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        })
      })
    }
  },

  // 删除分类
  deleteCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id
    
    // 检查分类下是否有商品
    const hasProducts = this.data.products.some(product => product.category === categoryId)
    if (hasProducts) {
      wx.showModal({
        title: '无法删除',
        content: '该分类下还有商品，无法删除',
        showCancel: false
      })
      return
    }
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个分类吗？',
      success: (res) => {
        if (res.confirm) {
          app.request({
            url: `/categories/${categoryId}`,
            method: 'DELETE'
          }).then(res => {
            if (res.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.loadCategories()
            }
          }).catch(error => {
            console.error('删除分类失败:', error)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // ========== 商品管理方法 ==========

  // 显示添加商品弹窗
  showAddProductModal: function () {
    this.setData({
      showProductModal: true,
      isProductEdit: false,
      productFormData: {
        name: '',
        description: '',
        categoryIndex: 0,
        image: ''
      }
    })
  },

  // 编辑商品
  editProduct: function (e) {
    const product = e.currentTarget.dataset.product
    const categoryIndex = this.data.categoryOptions.findIndex(cat => cat.id === product.category)
    
    this.setData({
      showProductModal: true,
      isProductEdit: true,
      editingProductId: product.id,
      productFormData: {
        name: product.name,
        description: product.description,
        categoryIndex: categoryIndex >= 0 ? categoryIndex : 0,
        image: product.image
      }
    })
  },

  // 隐藏商品弹窗
  hideProductModal: function () {
    this.setData({
      showProductModal: false
    })
  },

  // 阻止弹窗关闭
  preventClose: function () {
    // 阻止事件冒泡
  },

  // 商品输入框变化
  onProductInputChange: function (e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`productFormData.${field}`]: value
    })
  },

  // 分类选择
  onCategorySelect: function (e) {
    const index = e.detail.value
    this.setData({
      'productFormData.categoryIndex': index
    })
  },

  // 选择图片
  chooseImage: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          'productFormData.image': res.tempFilePaths[0]
        })
      }
    })
  },

  // 保存商品
  saveProduct: function () {
    const { productFormData, isProductEdit, editingProductId } = this.data
    
    // 验证表单
    if (!productFormData.name.trim()) {
      wx.showToast({
        title: '请输入商品名称',
        icon: 'none'
      })
      return
    }

    const category = this.data.categoryOptions[productFormData.categoryIndex]
    
    // 准备API数据
    const productData = {
      name: productFormData.name.trim(),
      description: productFormData.description.trim(),
      category_id: category.id,
      image: productFormData.image
    }
    
    if (isProductEdit) {
      // 编辑商品
      app.request({
        url: `/products/${editingProductId}`,
        method: 'PUT',
        data: productData
      }).then(res => {
        if (res.success) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          this.setData({
            showProductModal: false
          })
          this.loadProducts()
        }
      }).catch(error => {
        console.error('保存商品失败:', error)
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      })
    } else {
      // 添加新商品
      app.request({
        url: '/products',
        method: 'POST',
        data: productData
      }).then(res => {
        if (res.success) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          })
          this.setData({
            showProductModal: false
          })
          this.loadProducts()
        }
      }).catch(error => {
        console.error('添加商品失败:', error)
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        })
      })
    }
  },

  // 切换商品状态
  toggleStatus: function (e) {
    const productId = e.currentTarget.dataset.id
    const currentStatus = e.currentTarget.dataset.status
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available'
    
    // 找到当前商品
    const product = this.data.products.find(p => p.id === productId)
    if (!product) return
    
    // 准备更新数据
    const updateData = {
      name: product.name,
      description: product.description,
      category_id: product.category,
      image: product.image,
      status: newStatus
    }
    
    app.request({
      url: `/products/${productId}`,
      method: 'PUT',
      data: updateData
    }).then(res => {
      if (res.success) {
        wx.showToast({
          title: newStatus === 'available' ? '商品已上架' : '商品已下架',
          icon: 'success'
        })
        this.loadProducts()
      }
    }).catch(error => {
      console.error('切换商品状态失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  // 删除商品
  deleteProduct: function (e) {
    const productId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      success: (res) => {
        if (res.confirm) {
          app.request({
            url: `/products/${productId}`,
            method: 'DELETE'
          }).then(res => {
            if (res.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.loadProducts()
              this.loadCategories() // 重新加载分类以更新商品数量
            }
          }).catch(error => {
            console.error('删除商品失败:', error)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          })
        }
      }
    })
  }
})