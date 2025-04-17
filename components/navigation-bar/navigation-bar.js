Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表
   */
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    loading: {
      type: Boolean,
      value: false
    },
    homeButton: {
      type: Boolean,
      value: false,
    },
    animated: {
      // 显示隐藏的时候opacity动画效果
      type: Boolean,
      value: true
    },
    show: {
      // 显示隐藏导航，隐藏的时候navigation-bar的高度占位还在
      type: Boolean,
      value: true,
      observer: '_showChange'
    },
    // back为true的时候，返回的页面深度
    delta: {
      type: Number,
      value: 1
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    displayStyle: ''
  },
  lifetimes: {
    attached() {
      const rect = wx.getMenuButtonBoundingClientRect()
      // 只使用新的API，完全移除对已弃用API的依赖
      const windowInfo = wx.getWindowInfo()
      const appBaseInfo = wx.getAppBaseInfo()
      
      const isAndroid = appBaseInfo.platform === 'android'
      const isDevtools = appBaseInfo.platform === 'devtools'
      // 获取状态栏高度，确保在所有设备上都能正确适配
      const statusBarHeight = windowInfo.statusBarHeight || windowInfo.safeArea.top
      
      this.setData({
        ios: !isAndroid,
        innerPaddingRight: `padding-right: ${windowInfo.windowWidth - rect.left}px`,
        leftWidth: `width: ${windowInfo.windowWidth - rect.left}px`,
        // 使用状态栏高度和安全区域顶部高度的最大值，确保在所有机型上都有足够的顶部空间
        safeAreaTop: `height: calc(var(--height) + ${statusBarHeight}px); padding-top: ${statusBarHeight}px`
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    _showChange(show) {
      const animated = this.data.animated
      let displayStyle = ''
      if (animated) {
        // 只使用transform和opacity的过渡，这些是Skyline支持的属性
        displayStyle = `opacity: ${show ? '1' : '0'};
          transition: opacity 0.5s ease;`
      } else {
        displayStyle = `display: ${show ? '' : 'none'}`
      }
      this.setData({
        displayStyle
      })
    },
    back() {
      const data = this.data
      if (data.delta) {
        wx.navigateBack({
          delta: data.delta
        })
      }
      this.triggerEvent('back', { delta: data.delta }, {})
    }
  },
})
