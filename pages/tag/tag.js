// pages/tag/tag.js
// 导入文档工具模块
const documentUtils = require('../../utils/document');
const app = getApp(); // 在顶部引入 app

Page({
  data: {
    tags: [],
    searchValue: '',
    theme: 'light', // Add theme state
    fontStyleClass: '' // 添加字体样式类
  },
  
  onLoad: function() {
    // 从本地存储加载标签列表
    this.loadTags();
    this.updateTheme(); // Update theme on load
    this.applyGlobalFontStyle(); // 应用全局字体样式
  },
  
  onShow: function() {
    // 页面显示时刷新标签列表，确保显示最新数据
    this.loadTags();
    this.updateTheme(); // Update theme on show
    this.applyGlobalFontStyle(); // 应用全局字体样式
  },
  
  // 更新主题状态 (New)
  updateTheme() {
    this.setData({ theme: app.getCurrentTheme() });
    // Update navigation bar style if needed
  },

  // 主题变化回调 (New)
  onThemeChange(theme) {
    console.log('Tag page received theme change:', theme);
    this.setData({ theme: theme });
    // Update navigation bar style if needed
  },
  
  // 应用全局字体样式
  applyGlobalFontStyle: function() {
    const fontStyleClass = app.getGlobalStyleClass();
    this.setData({ fontStyleClass });
    console.log('Tag page applying font style:', fontStyleClass);
  },

  // 响应样式变化
  onStyleChange: function() {
    console.log('Tag page received style change');
    this.applyGlobalFontStyle();
  },
  
  // 加载标签数据
  loadTags: function() {
    // 使用工具函数获取所有标签
    const tags = documentUtils.getAllTags() || [];
    
    // 为每个标签计算文档数量
    const tagsWithCount = tags.map(tag => ({
      ...tag,
      documentCount: documentUtils.getDocumentsByTag(tag.id).length
    }));
    
    this.setData({
      tags: tagsWithCount
    });
  },
  
  // 搜索标签
  onSearch: function(e) {
    this.setData({
      searchValue: e.detail.value
    });
    // 实际应用中可以根据搜索值过滤标签列表
  },
  
  // 清除搜索
  clearSearch: function() {
    this.setData({
      searchValue: ''
    });
  },
  
  // 创建新标签
  createTag: function() {
    wx.navigateTo({
      url: '/pages/tag/tag-create/tag-create'
    });
  },
  
  // 查看标签详情
  viewTagDetail: function(e) {
    const tagId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/tag/tag-detail/tag-detail?id=' + tagId
    });
  },
  
  // 编辑标签
  editTag: function(e) {
    const tagId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/tag/tag-create/tag-create?id=' + tagId + '&mode=edit'
    });
  },
  
  // 删除标签
  deleteTag: function(e) {
    const tagId = e.currentTarget.dataset.id;
    const that = this;
    
    wx.showModal({
      title: '确认删除',
      content: '删除标签后，相关文档的标签关联将被移除，确定要删除吗？',
      confirmColor: '#FF4D4F',
      success(res) {
        if (res.confirm) {
          // 使用工具函数删除标签
          if (documentUtils.deleteTag(tagId)) {
            // 更新页面数据
            that.loadTags();
            
            wx.showToast({
              title: '已删除标签',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },
})