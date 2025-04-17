// pages/preview/preview.js
const app = getApp(); // 引入 app

Page({
  data: {
    documentId: '',
    documentTitle: '未命名文档',
    content: '',
    renderedContent: '',
    wordCount: 0,
    showMenu: false,
    theme: 'light' // Add theme state
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({
        documentId: options.id
      });
      this.loadDocument(options.id);
    }
    this.updateTheme(); // Update theme on load
  },

  onShow: function() {
    this.updateTheme(); // Update theme on show
  },

  // 更新主题状态 (New)
  updateTheme() {
    this.setData({ theme: app.getCurrentTheme() });
    // Update navigation bar style if needed
  },

  // 主题变化回调 (New)
  onThemeChange(theme) {
    console.log('Preview page received theme change:', theme);
    this.setData({ theme: theme });
    // Update navigation bar style if needed
  },

  // 加载文档内容
  loadDocument: function(docId) {
    // 这里应该从本地存储或云端获取文档内容
    // 示例代码，实际应根据项目需求实现
    const that = this;
    wx.showLoading({
      title: '加载中',
    });

    // 模拟加载数据
    setTimeout(function() {
      // 假设从存储中获取数据
      const doc = {
        id: docId,
        title: '项目计划书',
        content: '# 项目计划书\n\n## 项目目标\n\n开发一款高效、易用的移动端Markdown编辑器，为用户提供流畅的写作体验。\n\n## 功能需求\n\n1. **编辑功能**: 支持所有常用Markdown语法\n2. **实时预览**: 编辑的同时查看渲染效果\n3. **文件管理**: 创建、保存、分享文档\n4. **主题切换**: 明亮模式和多种颜色主题\n5. **导出功能**: 支持导出为PDF、HTML等格式'
      };

      that.setData({
        documentTitle: doc.title,
        content: doc.content,
        wordCount: that.countWords(doc.content)
      });

      // 渲染Markdown内容
      that.renderMarkdown(doc.content);

      wx.hideLoading();
    }, 500);
  },

  // 渲染Markdown内容
  renderMarkdown: function(markdown) {
    // 这里应该实现Markdown到HTML的转换
    // 示例代码，实际应使用Markdown解析库
    let html = this.simpleMarkdownToHtml(markdown);
    
    this.setData({
      renderedContent: html
    });
  },

  // 简单的Markdown转HTML实现
  // 注意：这只是一个非常简单的实现，实际应用中应使用成熟的Markdown解析库
  simpleMarkdownToHtml: function(markdown) {
    if (!markdown) return '';
    
    let html = markdown
      // 处理标题
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      // 处理粗体和斜体
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // 处理链接
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      // 处理图片
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">')
      // 处理列表
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // 处理引用
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // 处理代码
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // 处理段落
      .replace(/^(?!<[h|ul|ol|li|blockquote|code])(.+)$/gm, '<p>$1</p>');
    
    // 处理换行
    html = html.replace(/\n/g, '');
    
    return html;
  },

  // 计算字数
  countWords: function(text) {
    if (!text) return 0;
    // 移除markdown标记，只计算实际文本
    const plainText = text.replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1') // 链接
                         .replace(/!\[([^\]]*)\]\([^\)]*\)/g, '$1') // 图片
                         .replace(/\*\*([^*]*)\*\*/g, '$1') // 粗体
                         .replace(/\*([^*]*)\*/g, '$1') // 斜体
                         .replace(/#{1,6}\s?([^#]*)/g, '$1') // 标题
                         .replace(/`{1,3}[^`]*`{1,3}/g, '') // 代码
                         .replace(/\n/g, '') // 换行
                         .trim();
    
    return plainText.length;
  },

  // 切换到编辑模式
  switchToEdit: function() {
    // 返回编辑页面
    wx.navigateBack();
  },

  // 显示更多菜单
  showMoreMenu: function() {
    this.setData({
      showMenu: true
    });
  },

  // 隐藏更多菜单
  hideMoreMenu: function() {
    this.setData({
      showMenu: false
    });
  },

  // 分享文档
  shareDocument: function() {
    // 实现分享逻辑
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 下载文档
  downloadDocument: function() {
    this.showMoreMenu();
  },

  // 导出为Markdown
  exportAsMd: function() {
    this.hideMoreMenu();
    // 实现导出为Markdown逻辑
    wx.showToast({
      title: '导出Markdown功能开发中',
      icon: 'none'
    });
  },

  // 导出为HTML
  exportAsHtml: function() {
    this.hideMoreMenu();
    // 实现导出为HTML逻辑
    wx.showToast({
      title: '导出HTML功能开发中',
      icon: 'none'
    });
  },

  // 导出为PDF
  exportAsPdf: function() {
    this.hideMoreMenu();
    // 实现导出为PDF逻辑
    wx.showToast({
      title: '导出PDF功能开发中',
      icon: 'none'
    });
  },

  // 用户点击右上角分享
  onShareAppMessage: function() {
    return {
      title: this.data.documentTitle,
      path: '/pages/preview/preview?id=' + this.data.documentId
    };
  },
});