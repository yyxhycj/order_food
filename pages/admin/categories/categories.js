const userService = require('../../../services/user-service')
const recipeService = require('../../../services/recipe-service')
const { showError } = require('../../../utils/error')

Page({
  data: {
    categories: [],
    isAdmin: false,
    showModal: false,
    editingId: '',
    form: {
      name: '',
      description: '',
      icon: '',
      sort: 0,
      status: 'active'
    }
  },

  onShow() {
    this.checkAdmin()
  },

  async checkAdmin() {
    try {
      const user = await userService.getCurrentUser()
      const isAdmin = userService.isAdmin(user)
      this.setData({ isAdmin })

      if (!isAdmin) {
        wx.showToast({ title: '仅管理员可进入', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 600)
        return
      }

      this.loadCategories()
    } catch (error) {
      showError(error, '校验身份失败')
    }
  },

  async loadCategories() {
    try {
      const categories = await recipeService.getCategories({ includeInactive: true })
      this.setData({ categories })
    } catch (error) {
      showError(error, '加载分类失败')
    }
  },

  openCreate() {
    this.setData({
      showModal: true,
      editingId: '',
      form: {
        name: '',
        description: '',
        icon: '',
        sort: 0,
        status: 'active'
      }
    })
  },

  openEdit(e) {
    const category = this.data.categories[Number(e.currentTarget.dataset.index)]
    this.setData({
      showModal: true,
      editingId: category._fallback ? '' : category._id,
      form: {
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || '',
        sort: category.sort || 0,
        status: category.status || 'active'
      }
    })
  },

  closeModal() {
    this.setData({ showModal: false })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: e.detail.value
    })
  },

  onStatusChange(e) {
    this.setData({
      'form.status': e.detail.value ? 'active' : 'inactive'
    })
  },

  async saveCategory() {
    if (!(this.data.form.name || '').trim()) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }

    try {
      if (this.data.editingId) {
        await recipeService.updateCategory(this.data.editingId, this.data.form)
      } else {
        await recipeService.addCategory(this.data.form)
      }

      wx.showToast({ title: '已保存', icon: 'success' })
      this.setData({ showModal: false })
      this.loadCategories()
    } catch (error) {
      showError(error, '保存分类失败')
    }
  },

  noop() {}
})
