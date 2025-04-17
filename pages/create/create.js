// pages/create/create.js
// 导入文档工具模块
const documentUtils = require('../../utils/document');

Page({
  data: {
    documentTitle: '',
    // documentType: '未分类', // 暂时移除类型功能
    // templates: [ ... ], // 暂时移除模板功能
    allTags: [], // 所有可选标签
    selectedTagIds: [] // 已选中的标签ID
  },
  
  onLoad: function() {
    // 加载所有标签
    this.loadAllTags();
  },
  
  onShow: function() {
    // 页面显示时可以考虑重新加载标签，以防标签有变动
     this.loadAllTags();
  },
  
  // 加载所有标签
  loadAllTags: function() {
    const tags = documentUtils.getAllTags() || [];
    // 为标签添加选中状态
    const tagsWithSelectedState = tags.map(tag => ({
      ...tag,
      selected: this.data.selectedTagIds.includes(tag.id)
    }));
    this.setData({
      allTags: tagsWithSelectedState
    });
  },
  
  // 输入标题
  onTitleInput: function(e) {
    this.setData({
      documentTitle: e.detail.value.trim() // 去除前后空格
    });
  },
  
  // 选择或取消选择标签
  selectTag: function(e) {
    const tagId = e.currentTarget.dataset.id;
    const selectedTagIds = this.data.selectedTagIds;
    const index = selectedTagIds.indexOf(tagId);

    if (index > -1) {
      // 已选中，取消选择
      selectedTagIds.splice(index, 1);
    } else {
      // 未选中，添加选择
      selectedTagIds.push(tagId);
    }

    // 更新选中 ID 列表和标签的选中状态
    this.setData({
      selectedTagIds: selectedTagIds,
      // 更新 allTags 中对应标签的 selected 状态，以便 UI 反映
      allTags: this.data.allTags.map(tag => ({
        ...tag,
        selected: selectedTagIds.includes(tag.id)
      }))
    });
  },
  
  // // 选择文档类型 (暂时移除)
  // selectDocumentType: function() {
  //   wx.showToast({ title: '功能开发中', icon: 'none' });
  // },
  
  // // 选择模板 (暂时移除)
  // selectTemplate: function(e) {
  //   wx.showToast({ title: '功能开发中', icon: 'none' });
  // },
  
  // 创建文档
  createDocument: function() {
    if (!this.data.documentTitle) {
      wx.showToast({
        title: '请输入文档标题',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '创建中...' });

    // 准备文档数据
    const docData = {
      title: this.data.documentTitle,
      tags: this.data.selectedTagIds,
      content: '' // 新文档内容为空
    };

    // 调用工具函数创建文档
    const docId = documentUtils.createDocument(docData);

    wx.hideLoading();

    if (docId) {
      // 创建成功，跳转到编辑器页面
      // 使用 redirectTo，避免用户返回到这个创建页面
      wx.redirectTo({
        url: '/pages/editor/editor?id=' + docId,
        fail: (err) => {
          console.error('Redirect to editor failed:', err);
          // 如果跳转失败，可以给用户提示或尝试其他方式
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    } else {
      // 创建失败
      wx.showToast({
        title: '创建文档失败',
        icon: 'none'
      });
    }
  }
})