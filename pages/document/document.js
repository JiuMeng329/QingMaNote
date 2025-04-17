// pages/document/document.js
// 导入工具函数
const documentUtils = require('../../utils/document');
const formatTime = require('../../utils/formatTime');
const app = getApp(); // 在顶部引入 app

Page({
  data: {
    documents: [],
    searchValue: '',
    showSearch: false,
    // activeTab: '全部', // 暂时移除或重构标签页逻辑
    showDocMenu: false,
    currentDocId: null,
    currentDoc: {},
    pageTitle: '所有文档', // 页面标题
    currentTagId: null, // 用于记录当前是否在查看特定标签
    theme: 'light' // Add theme state
  },

  onLoad: function(options) {
    // // 如果有传入ID，则是查看特定文档 (这个逻辑似乎更适合编辑器页？)
    // if (options.id) {
    //   this.viewSpecificDocument(options.id);
    //   return;
    // }
    
    // 如果有传入标签ID，则显示该标签下的文档
    if (options.tagId) {
      this.setData({ currentTagId: options.tagId });
      this.loadTagDocuments(options.tagId);
    } else {
      // 默认加载所有文档
      this.loadDocuments();
    }
    this.updateTheme(); // Update theme on load
  },
  
  onShow: function() {
    // 每次显示页面时刷新文档列表
    // 判断是加载全部还是特定标签
    if (this.data.currentTagId) {
      this.loadTagDocuments(this.data.currentTagId);
    } else {
      this.loadDocuments();
    }
    
    this.updateTheme(); // Update theme on show
  },
  
  // 加载所有文档列表
  loadDocuments: function() {
    const documents = documentUtils.getAllDocuments().map(doc => ({
      ...doc,
      updateTimeFormatted: formatTime.timeAgo(doc.updateTime)
    }));
    
    this.setData({
      documents: documents,
      pageTitle: '所有文档' // 设置页面标题
    });
    wx.setNavigationBarTitle({ title: '所有文档' }); // 同时设置导航栏标题
  },
  
  // 加载特定标签下的文档
  loadTagDocuments: function(tagId) {
    const tag = documentUtils.getTagById(tagId);
    const pageTitle = tag ? `${tag.name} (${documentUtils.getDocumentsByTag(tagId).length})` : '标签文档';

    const documents = documentUtils.getDocumentsByTag(tagId).map(doc => ({
      ...doc,
      updateTimeFormatted: formatTime.timeAgo(doc.updateTime)
    }));
    
    this.setData({
      documents: documents,
      pageTitle: pageTitle // 设置页面标题
    });
     wx.setNavigationBarTitle({ title: pageTitle }); // 同时设置导航栏标题
  },
  
  // // 查看特定文档 (此函数似乎多余，点击列表项应直接跳转)
  // viewSpecificDocument: function(documentId) {
  //   // ... 
  // },
  
  // // 切换标签页 (暂时移除或重构)
  // switchTab: function(e) {
  //   // ...
  // },
  
  // // 根据标签筛选文档 (暂时移除或重构)
  // filterDocuments: function(tab) {
  //   // ...
  // },
  
  // 搜索文档
  onSearch: function(e) {
    const value = e.detail.value;
    this.setData({
      searchValue: value
    });
    
    if (value) {
      // 调用 documentUtils 进行搜索
      const searchResults = documentUtils.searchDocuments(value).map(doc => ({
          ...doc,
          updateTimeFormatted: formatTime.timeAgo(doc.updateTime)
      }));
      this.setData({
        documents: searchResults
      });
    } else {
      // 如果搜索框为空，恢复显示 (根据当前是在全部文档还是标签文档)
       if (this.data.currentTagId) {
          this.loadTagDocuments(this.data.currentTagId);
        } else {
          this.loadDocuments();
        }
    }
  },
  
  // 清除搜索
  clearSearch: function() {
    this.setData({
      searchValue: ''
    });
     // 恢复显示 (根据当前是在全部文档还是标签文档)
    if (this.data.currentTagId) {
      this.loadTagDocuments(this.data.currentTagId);
    } else {
      this.loadDocuments();
    }
  },
  
  // 切换搜索框显示
  toggleSearch: function() {
    this.setData({
      showSearch: !this.data.showSearch
    });
  },
  
  // 查看文档 (跳转到编辑器)
  viewDocument: function(e) {
    const documentId = e.currentTarget.dataset.id;
    wx.navigateTo({
        url: `/pages/editor/editor?id=${documentId}` // 直接传递ID到编辑器
    });
  },
  
  // 显示文档操作菜单
  showDocActions: function(e) {
    const documentId = e.currentTarget.dataset.id;
    // 从已加载的真实数据中查找 currentDoc
    const currentDoc = this.data.documents.find(doc => doc.id === documentId);
    
    this.setData({
      showDocMenu: true,
      currentDocId: documentId,
      currentDoc: currentDoc || {} // 确保 currentDoc 有值
    });
  },
  
  // 隐藏文档操作菜单
  hideDocMenu: function() {
    this.setData({
      showDocMenu: false
    });
  },
  
  // 显示全局操作菜单
  showGlobalActions: function() {
    // 暂时保留，但部分选项可能需要调整
    wx.showActionSheet({
      itemList: ['创建新文档', '导入文档', '排序方式', '设置'], // 可根据实际功能调整
      success: (res) => {
        switch(res.tapIndex) {
          case 0: // 创建新文档
            wx.navigateTo({
              url: '/pages/create/create' // 跳转到创建引导页
            });
            break;
          // 其他 case 暂时保留或注释掉
          // case 1: // 导入文档
          //   break;
          // case 2: // 排序方式
          //   break;
          case 3: // 设置
            wx.navigateTo({
              url: '/pages/profile/profile'
            });
            break;
        }
      }
    });
  },

  // === 文档操作菜单的具体实现 ===

  // 重命名文档 (需要输入新名称)
  renameDocument: function() {
    this.hideDocMenu();
    const docId = this.data.currentDocId;
    const currentTitle = this.data.currentDoc.title;
    
    wx.showModal({
      title: '重命名文档',
      editable: true,
      placeholderText: '请输入新的文档标题',
      content: currentTitle, // 将当前标题作为默认值显示在输入框
      success: (res) => {
        if (res.confirm && res.content && res.content !== currentTitle) {
          const newTitle = res.content;
          const doc = documentUtils.loadDocument(docId); // 加载完整文档
          if (doc) {
            doc.title = newTitle;
            if (documentUtils.saveDocument(doc)) {
              wx.showToast({ title: '重命名成功' });
              this.refreshCurrentList(); // 刷新列表
            } else {
              wx.showToast({ title: '重命名失败', icon: 'none' });
            }
          } else {
             wx.showToast({ title: '文档不存在', icon: 'none' });
          }
        }
      }
    });
  },

  // 分享文档
  shareDocument: function() {
     this.hideDocMenu();
     const docId = this.data.currentDocId;
     const title = this.data.currentDoc.title || '分享文档';
     // 允许页面分享
     wx.showShareMenu({
       withShareTicket: true,
       menus: ['shareAppMessage', 'shareTimeline']
     });
     // 这里可以考虑将分享所需信息暂存，然后在 onShareAppMessage 中使用
     // 或者直接让页面默认分享当前打开的文档（如果编辑器页也做了分享）
     wx.showToast({ title: '请点击右上角分享' , icon: 'none'});
  },

  // 切换收藏状态
  toggleFavorite: function() {
    const docId = this.data.currentDocId;
    const success = documentUtils.toggleFavorite(docId);
    this.hideDocMenu();
    if (success) {
      wx.showToast({ title: this.data.currentDoc.favorite ? '已取消收藏' : '已收藏' });
      this.refreshCurrentList(); // 刷新列表
    } else {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },
  
  // 添加标签
  addTag: function() {
    this.hideDocMenu();
    const docId = this.data.currentDocId;
    // 跳转到标签选择/创建页面，并传递文档ID
    wx.navigateTo({
      url: `/pages/tag/select-tag?docId=${docId}` // 假设有这样一个页面
    });
  },
  
  // 移动到文件夹（等同于修改标签）
  moveToFolder: function() {
     this.addTag(); // 复用添加标签的逻辑
  },
  
  // 归档文档 (功能待定，可以先注释)
  archiveDocument: function() {
    this.hideDocMenu();
    wx.showToast({ title: '归档功能开发中', icon: 'none' });
  },
  
  // 删除文档
  deleteDocument: function() {
    const docId = this.data.currentDocId;
    const title = this.data.currentDoc.title;
    this.hideDocMenu(); // 先关闭菜单

    wx.showModal({
      title: '删除文档',
      content: `确定要删除文档 "${title}" 吗？此操作不可撤销。`,
      confirmText: '删除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          const success = documentUtils.deleteDocument(docId);
          wx.hideLoading();
          
          if (success) {
            wx.showToast({ title: '已删除' });
            this.refreshCurrentList(); // 刷新列表
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },
  
  // 辅助函数：刷新当前列表（全部或标签）
  refreshCurrentList: function() {
    if (this.data.currentTagId) {
      this.loadTagDocuments(this.data.currentTagId);
    } else {
      this.loadDocuments();
    }
  },
  
  // 更新主题状态 (New)
  updateTheme() {
    this.setData({ theme: app.getCurrentTheme() });
    // Update navigation bar style if needed
  },

  // 主题变化回调 (New)
  onThemeChange(theme) {
    console.log('Document page received theme change:', theme);
    this.setData({ theme: theme });
    // Update navigation bar style if needed
  }
});