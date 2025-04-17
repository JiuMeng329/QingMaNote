// pages/index/index.js
// 导入文档工具模块
const documentUtils = require('../../utils/document');
// 导入时间格式化模块
const formatTime = require('../../utils/formatTime');
const app = getApp();

Page({
  data: {
    recentDocuments: [],
    folders: [],
    searchValue: '',
    showSearch: false,
    theme: 'light',
    themeMode: 'system'
  },

  onLoad: function() {
    // 页面加载时执行
    this.loadRecentDocuments();
    this.loadFolders();
    this.updateTheme();
  },
  
  onShow: function() {
    // 页面显示时执行，刷新数据
    this.loadRecentDocuments();
    this.loadFolders();
    this.updateTheme();
  },
  
  updateTheme() {
    this.setData({
      theme: app.getCurrentTheme(),
      themeMode: app.globalData.themeMode
    });
  },

  onThemeChange(theme) {
    console.log('Index page received theme change:', theme);
    this.setData({ theme: theme });
  },
  
  // 加载最近文档
  loadRecentDocuments: function() {
    // 获取最近文档列表，这里可以优化，只获取ID，然后批量获取详情
    const recentDocs = documentUtils.getRecentDocuments(5); // 获取最近 5 个
    
    // 格式化时间
    const formattedDocs = recentDocs.map(doc => ({
      ...doc,
      updateTimeFormatted: formatTime.timeAgo(doc.updateTime)
    }));

    this.setData({
      recentDocuments: formattedDocs
    });
  },
  
  // 加载文件夹 (标签)
  loadFolders: function() {
    // 获取所有标签
    const tags = documentUtils.getAllTags() || [];
    
    // 将标签数据转换为文件夹格式，并实时计算文档数量
    const folders = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      // 实时计算 count
      count: documentUtils.getDocumentsByTag(tag.id).length, 
      color: tag.color
    }));
    
    this.setData({
      folders: folders
    });
  },
  
  // 查看文档
  viewDocument: function(e) {
    const docId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/editor/editor?id=' + docId
    });
  },
  
  // 查看全部文档
  viewAllDocuments: function() {
    wx.navigateTo({
      url: '/pages/document/document'
    });
  },
  
  // 打开文件夹 (标签详情页)
  openFolder: function(e) {
    const folderId = e.currentTarget.dataset.id;
    // 跳转到标签详情页
    wx.navigateTo({
      url: '/pages/tag/tag-detail/tag-detail?id=' + folderId
    });
  },
  
  // 创建文件夹 (即创建标签)
  createFolder: function() {
    wx.navigateTo({
      url: '/pages/tag/tag-create/tag-create'
    });
  },
  
  // 管理文件夹 (即管理标签)
  manageFolders: function() {
    wx.navigateTo({
      url: '/pages/tag/tag'
    });
  },
  
  // 搜索功能 - Updated: Toggle inline search
  toggleSearch: function() {
    this.setData({ showSearch: !this.data.showSearch });
    if (!this.data.showSearch && this.data.searchValue) {
      // If hiding search and there was a value, clear search results
      this.clearSearch(); 
    }
  },

  // Handle search input (New)
  onSearchInput: function(e) {
    const value = e.detail.value;
    this.setData({
      searchValue: value
    });
    // Add search logic here later if needed
    // For now, just updates the input value
    if (value) {
      // Implement actual search filtering if desired
      // e.g., this.filterResults(value);
    } else {
      // If input is cleared, reset results
      this.loadRecentDocuments(); 
      this.loadFolders(); 
    }
  },

  // Clear search input (New)
  clearSearch: function() {
    this.setData({
      searchValue: ''
    });
    // Reset results
    this.loadRecentDocuments(); 
    this.loadFolders(); 
    // Consider hiding the search bar after clearing?
    // this.setData({ showSearch: false }); 
  },
  
  // 设置
  onSettings: function() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  },

  // 创建新文档
  createNewDocument: function() {
    wx.navigateTo({
      url: '/pages/create/create' // 跳转到真正的创建页或编辑器页
    });
  }
});