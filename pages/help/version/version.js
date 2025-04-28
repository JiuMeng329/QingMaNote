// pages/help/version/version.js
Page({
  data: {
    currentVersion: 'v1.0.7',
    versionHistory: [
      {
        version: 'v1.0.0',
        date: '2025-04-20',
        changes: [
          '首次发布',
          '支持Markdown文档的创建和编辑',
          '支持文档标签管理',
          '支持实时预览功能',
          '支持多种主题切换'
        ]
      },
      {
        version: 'v1.0.1',
        date: '2025-04-22',
        changes: [
          '新增导入功能，支持从聊天记录和本地文件导入',
          '新增拼写检查功能',
          '优化编辑器性能',
          '修复多个已知问题'
        ]
      },
      {
        version: 'v1.0.3',
        date: '2025-04-23',
        changes: [
          '新增导出功能，支持导出为Markdown,HTML,PDF,图片格式',
          '新增文档分享功能',
          '优化导出功能'
        ] 
      },
      {
        version: 'v1.0.4',
        date: '2025-04-24',
        changes: [
          '优化编辑器工具栏功能',
          '更新图标展示',
          '修复已知问题'
        ]
      },
      {
        version: 'v1.0.5',
        date: '2025-04-25',
        changes: [
          '优化代码高亮功能',
          '修复已知问题'
        ]
      },
      {
        version: 'v1.0.6',
        date: '2025-04-27',
        changes: [
          '优化新建文件与新建标签界面',
          '优化将文件添加到标签功能',
          '修复已知问题'
        ]
      },
      {
        version: 'v1.0.7',
        date: '2025-04-28',
        changes: [
          '新添加示例文件',
          '修复已知问题'
        ]
      }
    ],
    currentTheme: 'light',
    fontClass: ''
  },

  onLoad() {
    // 获取应用版本信息
    const app = getApp();
    if (app.globalData && app.globalData.version) {
      this.setData({
        currentVersion: app.globalData.version
      });
    }
    
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