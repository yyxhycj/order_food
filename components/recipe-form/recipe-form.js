const DEFAULT_FORM = {
  title: '',
  description: '',
  coverImage: '',
  categoryId: '',
  cookingTime: 30,
  difficulty: 'medium',
  tagsText: '',
  ingredients: [{ name: '', amount: '' }],
  steps: [{ text: '', image: '', sort: 1 }],
  tips: '',
  status: 'draft'
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}))
}

Component({
  properties: {
    value: {
      type: Object,
      value: {}
    },
    categories: {
      type: Array,
      value: []
    },
    submitting: {
      type: Boolean,
      value: false
    }
  },

  data: {
    form: clone(DEFAULT_FORM),
    difficultyOptions: [
      { label: '简单', value: 'easy' },
      { label: '中等', value: 'medium' },
      { label: '有挑战', value: 'hard' }
    ],
    timeOptions: [10, 15, 20, 30, 45, 60, 90, 120]
  },

  observers: {
    value(value) {
      const nextValue = value || {}
      this.setData({
        form: {
          ...clone(DEFAULT_FORM),
          ...clone(nextValue),
          ingredients: nextValue.ingredients && nextValue.ingredients.length ? nextValue.ingredients : clone(DEFAULT_FORM.ingredients),
          steps: nextValue.steps && nextValue.steps.length ? nextValue.steps : clone(DEFAULT_FORM.steps)
        }
      })
    }
  },

  methods: {
    emitChange() {
      this.triggerEvent('change', {
        value: this.data.form
      })
    },

    updateField(e) {
      const field = e.currentTarget.dataset.field
      this.setData({
        [`form.${field}`]: e.detail.value
      })
      this.emitChange()
    },

    onCategoryChange(e) {
      const category = this.data.categories[e.detail.value]
      this.setData({
        'form.categoryId': category ? category._id : '',
        'form.categoryName': category ? category.name : ''
      })
      this.emitChange()
    },

    onTimeChange(e) {
      const time = this.data.timeOptions[e.detail.value]
      this.setData({
        'form.cookingTime': time
      })
      this.emitChange()
    },

    selectDifficulty(e) {
      this.setData({
        'form.difficulty': e.currentTarget.dataset.value
      })
      this.emitChange()
    },

    updateIngredient(e) {
      const index = e.currentTarget.dataset.index
      const field = e.currentTarget.dataset.field
      this.setData({
        [`form.ingredients[${index}].${field}`]: e.detail.value
      })
      this.emitChange()
    },

    addIngredient() {
      const ingredients = this.data.form.ingredients.concat([{ name: '', amount: '' }])
      this.setData({ 'form.ingredients': ingredients })
      this.emitChange()
    },

    removeIngredient(e) {
      const index = Number(e.currentTarget.dataset.index)
      const ingredients = this.data.form.ingredients.filter((item, itemIndex) => itemIndex !== index)
      this.setData({
        'form.ingredients': ingredients.length ? ingredients : clone(DEFAULT_FORM.ingredients)
      })
      this.emitChange()
    },

    updateStep(e) {
      const index = e.currentTarget.dataset.index
      this.setData({
        [`form.steps[${index}].text`]: e.detail.value
      })
      this.emitChange()
    },

    addStep() {
      const steps = this.data.form.steps.concat([{ text: '', image: '', sort: this.data.form.steps.length + 1 }])
      this.setData({ 'form.steps': steps })
      this.emitChange()
    },

    removeStep(e) {
      const index = Number(e.currentTarget.dataset.index)
      const steps = this.data.form.steps
        .filter((item, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, sort: itemIndex + 1 }))
      this.setData({
        'form.steps': steps.length ? steps : clone(DEFAULT_FORM.steps)
      })
      this.emitChange()
    },

    chooseCover() {
      this.triggerEvent('choosecover')
    },

    chooseStepImage(e) {
      this.triggerEvent('choosestepimage', {
        index: e.currentTarget.dataset.index
      })
    },

    saveDraft() {
      this.triggerEvent('submit', {
        value: {
          ...this.data.form,
          status: 'draft'
        }
      })
    },

    publish() {
      this.triggerEvent('submit', {
        value: {
          ...this.data.form,
          status: 'published'
        }
      })
    }
  }
})
