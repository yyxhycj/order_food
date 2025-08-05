// pages/admin/store-config/store-config.js
const app = getApp()

Page({
  data: {
    loading: false,
    storeName: '',
    storeSubtitle: '',
    storeRating: '',
    monthSales: '',
    ratingPercent: '',
    bannerImage: '',
    bannerColor: '#ff6b6b',
    previewMode: false
  },

  onLoad() {
    this.loadStoreConfig()
  },

  // 加载店铺配置
  loadStoreConfig() {
    this.setData({ loading: true })
    
    app.request({
      url: '/store-config',
      method: 'GET'
    }).then(res => {
      if (res.success && res.data) {
        this.setData({
          storeName: res.data.store_name,
          storeSubtitle: res.data.store_subtitle,
          storeRating: res.data.store_rating.toString(),
          monthSales: res.data.month_sales.toString(),
          ratingPercent: res.data.rating_percent.toString(),
          bannerImage: res.data.banner_image || '',
          bannerColor: res.data.banner_color || '#ff6b6b'
        })
      }
    }).catch(error => {
      console.error('加载店铺配置失败:', error)
      wx.showToast({
        title: '加载配置失败',
        icon: 'error'
      })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  // 输入事件处理
  onStoreNameInput(e) {
    this.setData({ storeName: e.detail.value })
  },

  onStoreSubtitleInput(e) {
    this.setData({ storeSubtitle: e.detail.value })
  },

  onStoreRatingInput(e) {
    this.setData({ storeRating: e.detail.value })
  },

  onMonthSalesInput(e) {
    this.setData({ monthSales: e.detail.value })
  },

  onRatingPercentInput(e) {
    this.setData({ ratingPercent: e.detail.value })
  },

  onBannerColorInput(e) {
    this.setData({ bannerColor: e.detail.value })
  },

  // 上传横幅图片
  uploadBannerImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.uploadImage(tempFilePath)
      }
    })
  },

  // 上传图片到服务器
  uploadImage(filePath) {
    wx.showLoading({ title: '上传中...' })
    
    wx.uploadFile({
      url: 'http://localhost:3000/api/upload',
      filePath: filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.success) {
            this.setData({
              bannerImage: data.data.url
            })
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            })
          } else {
            throw new Error(data.message)
          }
        } catch (error) {
          wx.showToast({
            title: '上传失败',
            icon: 'error'
          })
        }
      },
      fail: (error) => {
        wx.showToast({
          title: '上传失败',
          icon: 'error'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 预览模式切换
  togglePreview() {
    this.setData({ 
      previewMode: !this.data.previewMode 
    })
  },

  // 保存配置
  saveConfig() {
    const { storeName, storeSubtitle, storeRating, monthSales, ratingPercent, bannerImage, bannerColor } = this.data
    
    // 基础验证
    if (!storeName.trim()) {
      wx.showToast({
        title: '请输入店铺名称',
        icon: 'none'
      })
      return
    }
    
    if (storeRating && (parseFloat(storeRating) < 0 || parseFloat(storeRating) > 5)) {
      wx.showToast({
        title: '评分范围0-5',
        icon: 'none'
      })
      return
    }
    
    if (ratingPercent && (parseInt(ratingPercent) < 0 || parseInt(ratingPercent) > 100)) {
      wx.showToast({
        title: '好评率范围0-100',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })
    
    app.request({
      url: '/store-config',
      method: 'PUT',
      data: {
        store_name: storeName,
        store_subtitle: storeSubtitle,
        store_rating: parseFloat(storeRating) || 4.6,
        month_sales: parseInt(monthSales) || 0,
        rating_percent: parseInt(ratingPercent) || 94,
        banner_image: bannerImage,
        banner_color: bannerColor
      }
    }).then(res => {
      if (res.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        throw new Error(res.message)
      }
    }).catch(error => {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'error'
      })
    }).finally(() => {
      wx.hideLoading()
    })
  },

  // 重置配置
  resetConfig() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有配置吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            storeName: '点单小程序',
            storeSubtitle: '(示例店铺)',
            storeRating: '4.6',
            monthSales: '2123',
            ratingPercent: '94',
            bannerImage: '',
            bannerColor: '#ff6b6b'
          })
        }
      }
    })
  }
}) 