const recipeService = require('../../../services/recipe-service')
const uploadService = require('../../../services/upload-service')
const { showError } = require('../../../utils/error')
const { validateRecipe } = require('../../../utils/validator')

function toForm(recipe) {
  if (!recipe) {
    return {
      title: '',
      description: '',
      coverImage: '',
      categoryId: '',
      categoryName: '',
      cookingTime: 30,
      difficulty: 'medium',
      tagsText: '',
      ingredients: [{ name: '', amount: '' }],
      steps: [{ text: '', image: '', sort: 1 }],
      tips: '',
      status: 'draft'
    }
  }

  return {
    ...recipe,
    tagsText: (recipe.tags || []).join(', ')
  }
}

function fromForm(form) {
  return {
    ...form,
    tags: (form.tagsText || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }
}

Page({
  data: {
    id: '',
    isEdit: false,
    loading: true,
    submitting: false,
    categories: [],
    form: toForm()
  },

  onLoad(options) {
    this.setData({
      id: options.id || '',
      isEdit: Boolean(options.id)
    })
    wx.setNavigationBarTitle({
      title: options.id ? '编辑菜谱' : '发布菜谱'
    })
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const categories = await recipeService.getCategories()
      let form = toForm()

      if (this.data.id) {
        const recipe = await recipeService.getRecipeDetail(this.data.id)
        const category = categories.find(item => item._id === recipe.categoryId)
        form = {
          ...toForm(recipe),
          categoryName: category ? category.name : ''
        }
      }

      this.setData({
        categories,
        form
      })
    } catch (error) {
      showError(error, '加载编辑数据失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  onFormChange(e) {
    this.setData({
      form: e.detail.value
    })
  },

  async onChooseCover() {
    wx.showLoading({ title: '上传中' })
    try {
      const fileID = await uploadService.chooseAndUploadImage('recipes/covers')
      this.setData({
        'form.coverImage': fileID
      })
    } catch (error) {
      showError(error, '上传主图失败')
    } finally {
      wx.hideLoading()
    }
  },

  async onChooseStepImage(e) {
    const index = e.detail.index
    wx.showLoading({ title: '上传中' })
    try {
      const fileID = await uploadService.chooseAndUploadImage('recipes/steps')
      this.setData({
        [`form.steps[${index}].image`]: fileID
      })
    } catch (error) {
      showError(error, '上传步骤图失败')
    } finally {
      wx.hideLoading()
    }
  },

  async onSubmit(e) {
    const recipe = fromForm(e.detail.value)
    const shouldPublish = recipe.status === 'published'
    const validation = validateRecipe(recipe, {
      requireCover: shouldPublish,
      requireCategory: shouldPublish
    })

    if (!validation.valid) {
      wx.showToast({ title: validation.message, icon: 'none' })
      return
    }

    this.setData({
      submitting: true,
      form: e.detail.value
    })

    try {
      const result = this.data.id
        ? await recipeService.updateRecipe(this.data.id, recipe)
        : await recipeService.createRecipe(recipe)
      const id = this.data.id || result.id

      wx.showToast({
        title: recipe.status === 'published' ? '已发布' : '已保存',
        icon: 'success'
      })

      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/recipe/detail/detail?id=${id}`
        })
      }, 600)
    } catch (error) {
      showError(error, '保存失败')
    } finally {
      this.setData({ submitting: false })
    }
  }
})
