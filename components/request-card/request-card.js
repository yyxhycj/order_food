Component({
  properties: {
    request: {
      type: Object,
      value: {}
    },
    mode: {
      type: String,
      value: 'mine'
    }
  },

  methods: {
    handleTap() {
      this.triggerEvent('requesttap', {
        id: this.data.request._id,
        request: this.data.request
      })
    },

    emitAction(e) {
      const action = e.currentTarget.dataset.action
      this.triggerEvent('action', {
        action,
        id: this.data.request._id,
        request: this.data.request
      })
    },

    noop() {
      return false
    }
  }
})
