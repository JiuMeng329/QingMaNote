// pages/tag/tag-detail/tag-detail.js
// 导入文档工具模块
const documentUtils = require('../../../utils/document');
// 导入时间格式化工具
const formatTime = require('../../../utils/formatTime'); // 假设你有一个时间格式化工具
const app = getApp(); // 引入 app

Page({
  data: {
    tagId: null,
    tag: null,
    documents: [],
    isLoading: true,
    headerTextColor: '#FFFFFF', // 默认导航栏文字颜色为白色
    theme: 'light' // Add theme state
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({
        tagId: options.id
      });
      this.loadTagData(options.id);
    } else {
      wx.showToast({
        title: '缺少标签ID',
        icon: 'none',
        complete: () => {
          setTimeout(() => wx.navigateBack(), 1500);
        }
      });
    }
    this.updateTheme(); // Update theme on load
  },
  
  onShow: function() {
    // 页面显示时，如果tagId存在，重新加载数据，确保标签或文档更新后能及时反映
    if (this.data.tagId) {
      this.loadTagData(this.data.tagId);
    }
    
    this.updateTheme(); // Update theme on show
  },

  // 更新主题状态 (New)
  updateTheme() {
    const currentTheme = app.getCurrentTheme();
    this.setData({ theme: currentTheme });
    // Update navigation bar color based on theme and tag color?
    // This might be complex. Keeping dynamic nav bar color for now.
  },

  // 主题变化回调 (New)
  onThemeChange(theme) {
    console.log('Tag detail page received theme change:', theme);
    this.setData({ theme: theme });
    // Update navigation bar color?
  },

  // 加载标签数据
  loadTagData: function(tagId) {
    this.setData({ isLoading: true });
    
    const tagData = documentUtils.getTagById(tagId);
    
    if (tagData) {
      const documents = documentUtils.getDocumentsByTag(tagId).map(doc => ({
        ...doc,
        // 格式化时间
        updateTimeFormatted: formatTime.timeAgo(doc.updateTime) // 使用 timeAgo 或其他合适的函数
      }));
      
      // 根据标签颜色决定导航栏文字颜色
      const headerTextColor = this.getHeaderTextColor(tagData.color);
      
      this.setData({
        tag: tagData,
        documents: documents,
        isLoading: false,
        headerTextColor: headerTextColor
      });
      
      // 动态设置导航栏标题
      wx.setNavigationBarTitle({ title: tagData.name });
      // 动态设置导航栏背景色和文字颜色
      wx.setNavigationBarColor({
        frontColor: headerTextColor,
        backgroundColor: tagData.color,
        animation: { duration: 0 } // 无动画效果
      });
      
    } else {
      this.setData({ isLoading: false });
      wx.showToast({
        title: '标签不存在或已删除',
        icon: 'none',
        complete: () => {
          setTimeout(() => wx.navigateBack(), 1500);
        }
      });
    }
  },
  
  // 根据背景色计算合适的文字颜色（白色或黑色）
  getHeaderTextColor: function(backgroundColor) {
    if (!backgroundColor) return '#ffffff'; // 默认白色
    try {
      // 移除 # 号
      const hex = backgroundColor.replace('#', '');
      // 解析 RGB
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      // 计算亮度 (简单的亮度公式)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      // 根据亮度返回颜色
      return brightness > 150 ? '#000000' : '#ffffff';
    } catch (e) {
      console.error('Error parsing color:', e);
      return '#ffffff'; // 解析失败返回白色
    }
  },

  // 查看文档详情
  viewDocument: function(e) {
    const documentId = e.currentTarget.dataset.id;
    // 跳转到文档编辑页或预览页，取决于你的应用流程
    wx.navigateTo({
      url: '/pages/editor/editor?id=' + documentId
    });
  },

  // 编辑标签
  editTag: function() {
    wx.navigateTo({
      url: '/pages/tag/tag-create/tag-create?id=' + this.data.tagId + '&mode=edit'
    });
  },

  // 删除标签
  deleteTag: function() {
    const that = this;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除标签 "${that.data.tag.name}" 吗？相关文档的标签关联将被移除。`,
      confirmText: '删除',
      confirmColor: '#FF4D4F',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          const success = documentUtils.deleteTag(that.data.tagId);
          wx.hideLoading();
          
          if (success) {
            wx.showToast({
              title: '已删除标签',
              icon: 'success'
            });
            // 返回上一页
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
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

  // 添加文档到标签
  addDocument: function() {
    // 这里需要跳转到一个文档选择页面，让用户选择要添加到此标签的文档
    // 假设选择页面路径为 /pages/document/select-document
    wx.navigateTo({
      url: '/pages/document/select-document?mode=addTag&tagId=' + this.data.tagId
    });
    // 或者，如果文档选择逻辑比较复杂，可以在当前页面弹出选择器
    // wx.showToast({
    //   title: '功能开发中',
    //   icon: 'none'
    // });
  },
  
  // 用户点击右上角分享
  onShareAppMessage: function() {
    return {
      title: this.data.tag ? `标签：${this.data.tag.name} - MarkMark` : 'MarkMark标签分享',
      path: '/pages/tag/tag-detail/tag-detail?id=' + this.data.tagId,
      // 可以添加 imageUrl
      // imageUrl: '...'
    };
  },
  
  // 如果需要分享到朋友圈，可以添加 onShareTimeline
  onShareTimeline: function() {
     return {
      title: this.data.tag ? `标签：${this.data.tag.name}` : 'MarkMark标签',
      query: 'id=' + this.data.tagId,
      // imageUrl: '...'
    };
  },
})