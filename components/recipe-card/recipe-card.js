Component({
  properties: {
    recipe: {
      type: Object,
      value: {}
    },
    compact: {
      type: Boolean,
      value: false
    },
    showStatus: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    handleTap() {
      this.triggerEvent('recipetap', {
        id: this.data.recipe._id,
        recipe: this.data.recipe
      })
    },

    handleEdit(e) {
      e.stopPropagation && e.stopPropagation()
      this.triggerEvent('edit', {
        id: this.data.recipe._id,
        recipe: this.data.recipe
      })
    }
  }
})
