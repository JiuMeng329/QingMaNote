// pages/help/tutorial/tutorial.js
Page({
  data: {
    features: [
      {
        title: '文档创建与编辑',
        description: '创建新的Markdown文档，使用内置编辑器进行编辑。支持常用的Markdown语法，实时预览效果。'
      },
      {
        title: '文档分类与标签',
        description: '使用标签对文档进行分类和组织，便于快速查找。可以创建、编辑和管理多个标签。'
      },
      {
        title: '导入与导出',
        description: '支持从聊天记录或本地文件导入Markdown文档，也可以将文档导出为Markdown、HTML或PDF格式。'
      },
      {
        title: '拼写检查',
        description: '内置拼写检查功能，帮助您捕获和修正拼写错误，提高文档质量。'
      },
      {
        title: '主题切换',
        description: '支持浅色，深色和GIthub风格三种主题，根据您的喜好或环境切换，保护眼睛。'
      }
    ],
    currentTheme: 'light',
    fontClass: ''
  },

  onLoad() {
    // 设置主题
    this.updateTheme();
  },

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
  }
});