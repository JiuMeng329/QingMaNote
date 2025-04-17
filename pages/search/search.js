// pages/search/search.js
const documentUtils = require('../../utils/document');
const formatTime = require('../../utils/formatTime');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    searchKeyword: '',
    searchResults: [],
    searchHistory: [],
    isSearching: false,
    globalStyleClass: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 加载搜索历史
    this.loadSearchHistory();
    
    // 如果有传入的关键词，直接搜索
    if (options && options.keyword) {
      this.setData({ searchKeyword: options.keyword });
      this.doSearch();
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查并应用全局样式更新
    const app = getApp();
    if (app.globalData.styleChanged) {
      this.applyGlobalStyle();
      app.globalData.styleChanged = false; // 重置标识
    }
    
    // 刷新搜索历史
    this.loadSearchHistory();
  },
  
  // 应用全局样式
  applyGlobalStyle: function() {
    const app = getApp();
    const globalStyleClass = app.getGlobalStyleClass();
    this.setData({ globalStyleClass: globalStyleClass }); 
    console.log('Search page applying global style:', globalStyleClass);
  },

  // 输入搜索关键词
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    
    // 如果清空了搜索框，清空搜索结果
    if (!e.detail.value) {
      this.setData({
        searchResults: []
      });
    }
  },
  
  // 执行搜索
  doSearch: function() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isSearching: true });
    
    // 调用文档工具搜索文档
    const results = documentUtils.searchDocuments(keyword);
    
    // 处理搜索结果，添加预览和格式化时间
    const formattedResults = results.map(doc => {
      // 生成预览文本，截取包含关键词的部分
      let preview = '';
      if (doc.content) {
        const keywordIndex = doc.content.toLowerCase().indexOf(keyword.toLowerCase());
        if (keywordIndex > -1) {
          // 截取关键词前后的一部分文本作为预览
          const start = Math.max(0, keywordIndex - 15);
          const end = Math.min(doc.content.length, keywordIndex + keyword.length + 30);
          preview = (start > 0 ? '...' : '') + 
                   doc.content.substring(start, end) + 
                   (end < doc.content.length ? '...' : '');
        } else {
          // 如果内容中没找到关键词（可能在标题中），则取开头一部分
          preview = doc.content.substring(0, 50) + (doc.content.length > 50 ? '...' : '');
        }
      }
      
      // 获取标签名称
      const tagNames = [];
      if (doc.tags && doc.tags.length > 0) {
        doc.tags.forEach(tagId => {
          const tag = documentUtils.getTagById(tagId);
          if (tag) tagNames.push(tag.name);
        });
      }
      
      return {
        ...doc,
        preview: preview,
        updateTime: formatTime.timeAgo(doc.updateTime),
        tags: tagNames
      };
    });
    
    this.setData({
      searchResults: formattedResults,
      isSearching: false
    });
    
    // 保存到搜索历史
    this.saveSearchHistory(keyword);
  },
  
  // 清空搜索
  clearSearch: function() {
    this.setData({
      searchKeyword: '',
      searchResults: []
    });
  },
  
  // 取消搜索，返回上一页
  onCancel: function() {
    wx.navigateBack();
  },
  
  // 查看文档详情
  viewDocument: function(e) {
    const documentId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/editor/editor?id=' + documentId
    });
  },
  
  // 加载搜索历史
  loadSearchHistory: function() {
    try {
      const history = wx.getStorageSync('markmark_search_history') || [];
      this.setData({ searchHistory: history });
    } catch (e) {
      console.error('加载搜索历史失败：', e);
      this.setData({ searchHistory: [] });
    }
  },
  
  // 保存搜索历史
  saveSearchHistory: function(keyword) {
    if (!keyword) return;
    
    try {
      let history = wx.getStorageSync('markmark_search_history') || [];
      
      // 如果已存在相同关键词，先移除
      history = history.filter(item => item !== keyword);
      
      // 添加到开头
      history.unshift(keyword);
      
      // 限制历史记录数量为10条
      if (history.length > 10) {
        history = history.slice(0, 10);
      }
      
      // 保存到本地存储
      wx.setStorageSync('markmark_search_history', history);
      
      // 更新页面数据
      this.setData({ searchHistory: history });
    } catch (e) {
      console.error('保存搜索历史失败：', e);
    }
  },
  
  // 清除搜索历史
  clearHistory: function() {
    try {
      wx.removeStorageSync('markmark_search_history');
      this.setData({ searchHistory: [] });
      wx.showToast({
        title: '已清除搜索历史',
        icon: 'success'
      });
    } catch (e) {
      console.error('清除搜索历史失败：', e);
      wx.showToast({
        title: '清除失败',
        icon: 'none'
      });
    }
  },
  
  // 使用历史关键词搜索
  useHistoryKeyword: function(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ searchKeyword: keyword });
    this.doSearch();
  }
});