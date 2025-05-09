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
    fontStyleClass: ''
  },

  onLoad() {
    // 设置主题
    this.updateTheme();
    // 应用字体样式
    this.applyGlobalFontStyle();
  },

  onShow() {
    // 每次显示页面时更新主题
    this.updateTheme();
    // 应用字体样式
    this.applyGlobalFontStyle();
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
  },

  /**
   * 应用全局字体样式
   */
  applyGlobalFontStyle: function() {
    const app = getApp();
    const fontStyleClass = app.getGlobalStyleClass();
    this.setData({ fontStyleClass });
    console.log('Tutorial page applying font style:', fontStyleClass);
  },

  /**
   * 响应样式变化
   */
  onStyleChange: function() {
    console.log('Tutorial page received style change');
    this.applyGlobalFontStyle();
  },

  /**
   * 主题变化回调
   */
  onThemeChange(theme) {
    console.log('Tutorial page received theme change:', theme);
    this.setData({ currentTheme: theme });
  }
});