// pages/favorite/favorite.js
// 导入工具函数
const documentUtils = require('../../utils/document');
const formatTime = require('../../utils/formatTime');

Page({
  data: {
    favoriteDocuments: []
  },
  
  onLoad: function() {
    this.loadFavorites();
  },
  
  onShow: function() {
    // 每次显示时重新加载，确保数据最新
    this.loadFavorites();
    
    // 检查并应用全局样式更新
    const app = getApp();
    if (app.globalData.styleChanged) {
      this.applyGlobalStyle();
      app.globalData.styleChanged = false; // 重置标识
    }
  },

  // 加载收藏文档列表
  loadFavorites: function() {
    const favoriteDocs = documentUtils.getFavoriteDocuments().map(doc => ({
      ...doc,
      updateTimeFormatted: formatTime.timeAgo(doc.updateTime)
      // 暂时不处理标签显示，如果需要，可以在这里根据 doc.tags 获取标签信息
    }));
    this.setData({
      favoriteDocuments: favoriteDocs
    });
  },
  
  // 查看文档详情
  viewDocument: function(e) {
    const documentId = e.currentTarget.dataset.id;
    // 跳转到编辑器页面
    wx.navigateTo({
      url: '/pages/editor/editor?id=' + documentId
    });
  },
  
  // 取消收藏
  cancelFavorite: function(e) {
    const documentId = e.currentTarget.dataset.id;
    const success = documentUtils.toggleFavorite(documentId);
    
    if (success) {
      wx.showToast({
        title: '已取消收藏',
        icon: 'success'
      });
      // 重新加载列表以反映变化
      this.loadFavorites(); 
    } else {
       wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },
  
  // 应用全局样式
  applyGlobalStyle: function() {
    const app = getApp();
    const globalStyleClass = app.getGlobalStyleClass();
    this.setData({ globalStyleClass: globalStyleClass }); 
    console.log('Favorite page applying global style:', globalStyleClass);
  }
})