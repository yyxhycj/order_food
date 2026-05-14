Component({
  properties: {
    image: {
      type: String,
      value: '/images/empty-recipes.png'
    },
    title: {
      type: String,
      value: '这里还没有内容'
    },
    description: {
      type: String,
      value: ''
    },
    buttonText: {
      type: String,
      value: ''
    }
  },

  methods: {
    handleAction() {
      this.triggerEvent('action')
    }
  }
})
