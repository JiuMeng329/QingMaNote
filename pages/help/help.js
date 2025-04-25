// pages/help/help.js
Page({
  data: {
    helpItems: [
      {
        id: 'markdown',
        title: 'Markdown语法指南',
        icon: 'markdown-icon',
        path: '/pages/help/markdown/markdown'
      },
      {
        id: 'tutorial',
        title: '功能介绍/使用教程',
        icon: 'tutorial-icon',
        path: '/pages/help/tutorial/tutorial'
      },
      {
        id: 'version',
        title: '版本信息与更新日志',
        icon: 'version-icon',
        path: '/pages/help/version/version'
      }
    ],
    version: 'v1.0.5',
    currentTheme: 'light',
    fontClass: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取应用版本信息
    const app = getApp();
    if (app.globalData && app.globalData.version) {
      this.setData({
        version: app.globalData.version
      });
    }

    // 设置主题
    this.updateTheme();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时更新主题
    this.updateTheme();
  },

  /**
   * 更新主题
   */
  updateTheme() {
    const app = getApp();
    
    // 获取当前主题
    if (app.getCurrentTheme) {
      const theme = app.getCurrentTheme();
      this.setData({ currentTheme: theme });
    }
    
    // 获取字体设置
    if (app.globalData && app.globalData.fontClass) {
      this.setData({ fontClass: app.globalData.fontClass });
    }
  },

  /**
   * 跳转到对应的帮助页面
   */
  navigateToHelpItem(e) {
    const { path } = e.currentTarget.dataset;
    wx.navigateTo({
      url: path
    });
  }
});