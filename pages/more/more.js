// pages/more/more.js
Page({
  data: {
    documentId: '',
    documentTitle: '',
    showExportOptions: false
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({
        documentId: options.id
      });
      this.loadDocumentInfo(options.id);
    }
    if (options.title) {
      this.setData({
        documentTitle: options.title
      });
    }
  },

  // 加载文档信息
  loadDocumentInfo: function(docId) {
    // 这里应该从本地存储或云端获取文档信息
    // 示例代码，实际应根据项目需求实现
    const that = this;
    
    // 模拟加载数据
    setTimeout(function() {
      // 假设从存储中获取数据
      const doc = {
        id: docId,
        title: '项目计划书'
      };

      that.setData({
        documentTitle: doc.title
      });
    }, 500);
  },

  // 分享文档
  shareDocument: function() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 导出文档
  exportDocument: function() {
    this.setData({
      showExportOptions: true
    });
  },

  // 隐藏导出选项
  hideExportOptions: function() {
    this.setData({
      showExportOptions: false
    });
  },

  // 导出为Markdown
  exportAsMd: function() {
    this.hideExportOptions();
    // 实现导出为Markdown逻辑
    wx.showToast({
      title: '导出Markdown功能开发中',
      icon: 'none'
    });
  },

  // 导出为HTML
  exportAsHtml: function() {
    this.hideExportOptions();
    // 实现导出为HTML逻辑
    wx.showToast({
      title: '导出HTML功能开发中',
      icon: 'none'
    });
  },

  // 导出为PDF
  exportAsPdf: function() {
    this.hideExportOptions();
    // 实现导出为PDF逻辑
    wx.showToast({
      title: '导出PDF功能开发中',
      icon: 'none'
    });
  },

  // 移动到文件夹
  moveToFolder: function() {
    // 实现移动到文件夹逻辑
    wx.showToast({
      title: '移动功能开发中',
      icon: 'none'
    });
  },

  // 添加标签
  addTag: function() {
    // 实现添加标签逻辑
    wx.navigateTo({
      url: '/pages/tag/tag-create/tag-create?docId=' + this.data.documentId
    });
  },

  // 查看历史版本
  viewHistory: function() {
    // 实现查看历史版本逻辑
    wx.showToast({
      title: '历史版本功能开发中',
      icon: 'none'
    });
  },

  // 删除文档
  deleteDocument: function() {
    const that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此文档吗？',
      confirmColor: '#FF4D4F',
      success(res) {
        if (res.confirm) {
          // 实现删除文档逻辑
          wx.showToast({
            title: '删除成功',
            icon: 'success',
            success: function() {
              setTimeout(function() {
                wx.navigateBack();
              }, 1500);
            }
          });
        }
      }
    });
  },

  // 用户点击右上角分享
  onShareAppMessage: function() {
    return {
      title: this.data.documentTitle,
      path: '/pages/editor/editor?id=' + this.data.documentId
    };
  }
})