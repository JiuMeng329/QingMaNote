const app = getApp();
const formatTime = require('../../utils/formatTime');
const documentUtils = require('../../utils/document');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    theme: 'light',
    tagId: '', // 当前标签ID
    tagName: '', // 当前标签名称
    isLoading: true,
    searchValue: '',
    allDocs: [], // 所有文档
    selectedDocs: [], // 已选择的文档
    originalDocs: [] // 已经添加到标签的原始文档列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 获取标签ID
    if (options.tagId) {
      this.setData({ 
        tagId: options.tagId,
        theme: app.getCurrentTheme() || 'light'
      });
      
      // 加载标签信息
      this.loadTagInfo();
      
      // 加载所有文档
      this.loadDocuments();
    } else {
      wx.showToast({
        title: '标签ID无效',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 更新主题
    this.setData({
      theme: app.getCurrentTheme() || 'light'
    });
  },

  /**
   * 加载标签信息
   */
  loadTagInfo: function() {
    const tag = documentUtils.getTagById(this.data.tagId);
    if (tag) {
      this.setData({ tagName: tag.name });
      wx.setNavigationBarTitle({
        title: `添加文档到: ${tag.name}`
      });
    }
  },

  /**
   * 加载所有文档
   */
  loadDocuments: function() {
    this.setData({ isLoading: true });

    // 获取所有文档
    const docs = documentUtils.getAllDocuments() || [];
    
    // 获取已添加到此标签的文档
    const tagDocs = documentUtils.getDocumentsByTag(this.data.tagId) || [];
    const tagDocIds = tagDocs.map(doc => doc.id);
    
    // 标记哪些文档已经被选中
    const formattedDocs = docs.map(doc => {
      return {
        ...doc,
        selected: tagDocIds.includes(doc.id),
        updateTimeFormatted: formatTime.timeAgo(doc.updateTime)
      };
    });
    
    // 已选文档
    const selectedDocs = formattedDocs.filter(doc => doc.selected);
    
    this.setData({
      allDocs: formattedDocs,
      selectedDocs: selectedDocs,
      originalDocs: [...tagDocIds], // 保存原始已添加文档ID列表
      isLoading: false
    });
  },

  /**
   * 搜索文档
   */
  onSearch: function(e) {
    const searchValue = e.detail.value;
    this.setData({ searchValue });
    
    if (!searchValue) {
      // 如果搜索值为空，恢复所有文档
      this.loadDocuments();
      return;
    }
    
    // 过滤文档
    const filteredDocs = this.data.allDocs.filter(doc => {
      return doc.title.toLowerCase().includes(searchValue.toLowerCase());
    });
    
    this.setData({ allDocs: filteredDocs });
  },

  /**
   * 清除搜索
   */
  clearSearch: function() {
    this.setData({ searchValue: '' });
    this.loadDocuments();
  },

  /**
   * 切换文档选择状态
   */
  toggleDocSelection: function(e) {
    const docId = e.currentTarget.dataset.id;
    
    // 更新allDocs中的选中状态
    const allDocs = this.data.allDocs.map(doc => {
      if (doc.id === docId) {
        return { ...doc, selected: !doc.selected };
      }
      return doc;
    });
    
    // 更新已选文档列表
    const selectedDocs = allDocs.filter(doc => doc.selected);
    
    this.setData({
      allDocs,
      selectedDocs
    });
  },

  /**
   * 保存选择
   */
  saveSelection: function() {
    const selectedDocIds = this.data.selectedDocs.map(doc => doc.id);
    const originalDocIds = this.data.originalDocs;
    
    // 需要添加的文档
    const docsToAdd = selectedDocIds.filter(id => !originalDocIds.includes(id));
    
    // 需要移除的文档
    const docsToRemove = originalDocIds.filter(id => !selectedDocIds.includes(id));
    
    wx.showLoading({ title: '保存中...' });
    
    try {
      // 添加文档到标签
      docsToAdd.forEach(docId => {
        documentUtils.addDocumentToTag(docId, this.data.tagId);
      });
      
      // 从标签中移除文档
      docsToRemove.forEach(docId => {
        documentUtils.removeDocumentFromTag(docId, this.data.tagId);
      });
      
      wx.hideLoading();
      
      // 显示成功提示并返回
      wx.showToast({
        title: '已保存',
        icon: 'success'
      });
      
      // 向上一页面传递选中的文档ID
      const eventChannel = this.getOpenerEventChannel();
      if (eventChannel && eventChannel.emit) {
        eventChannel.emit('selectDocuments', selectedDocIds);
      }
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
      console.error('Error saving document-tag relationships:', error);
    }
  }
}); 