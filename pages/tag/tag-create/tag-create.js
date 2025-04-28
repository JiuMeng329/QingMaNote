// pages/tag/tag-create/tag-create.js
// 导入文档工具模块
const documentUtils = require('../../../utils/document');
const app = getApp(); // 获取 app 实例

Page({
  data: {
    mode: 'create', // 'create' 或 'edit'
    tagId: null,
    tagName: '',
    tagDescription: '',
    selectedColor: '#FF4D4F', // 默认选择红色
    colors: [
      '#FF4D4F', // 红色
      '#FA8C16', // 橙色
      '#52C41A', // 绿色
      '#1890FF', // 蓝色
      '#722ED1', // 紫色
      '#EB2F96', // 粉色
      '#666666', // 灰色
      '#000000'  // 黑色
    ],
    theme: 'light' // 添加 theme 状态
  },

  onLoad: function(options) {
    this.updateTheme(); // 加载时更新主题

    // 判断是创建模式还是编辑模式
    if (options.mode === 'edit' && options.id) {
      this.setData({
        mode: 'edit',
        tagId: options.id
      });
      
      // 使用工具函数获取标签信息
      const tag = documentUtils.getTagById(options.id);
      
      if (tag) {
        this.setData({
          tagName: tag.name,
          tagDescription: tag.description || '',
          selectedColor: tag.color
        });
      }
    }
  },

  onShow: function() {
    // 页面显示时也可能需要更新主题，以防从后台切换回来时系统主题已改变
    this.updateTheme(); 
  },

  // --- 主题相关方法 ---
  // 更新主题状态
  updateTheme() {
    if (app.getCurrentTheme) {
      const theme = app.getCurrentTheme();
      this.setData({ theme: theme });
      // 可选：根据主题更新导航栏颜色等
      // this.updateNavBarStyle(theme);
    }
  },

  // 主题变化回调
  onThemeChange(theme) {
    console.log('Tag Create page received theme change:', theme);
    this.setData({ theme: theme });
    // 可选：根据主题更新导航栏颜色等
    // this.updateNavBarStyle(theme);
  },

  // 输入标签名称
  onInputName: function(e) {
    this.setData({
      tagName: e.detail.value
    });
  },

  // 输入标签描述
  onInputDescription: function(e) {
    this.setData({
      tagDescription: e.detail.value
    });
  },

  // 选择颜色
  selectColor: function(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      selectedColor: color
    });
  },

  // 保存标签
  saveTag: function() {
    // 验证表单
    if (!this.data.tagName.trim()) {
      wx.showToast({
        title: '请输入标签名称',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: this.data.mode === 'create' ? '创建中...' : '保存中...'
    });

    // 准备标签数据
    const tagData = {
      name: this.data.tagName,
      color: this.data.selectedColor,
      description: this.data.tagDescription
    };

    let result = false;
    
    // 判断是创建还是编辑模式
    if (this.data.mode === 'create') {
      // 创建模式：使用工具函数创建新标签
      const tagId = documentUtils.createTag(tagData);
      result = !!tagId;
    } else {
      // 编辑模式：使用工具函数更新现有标签
      tagData.id = this.data.tagId;
      result = documentUtils.saveTag(tagData);
    }

    wx.hideLoading();
    
    if (result) {
      wx.showToast({
        title: this.data.mode === 'create' ? '创建成功' : '保存成功',
        icon: 'success'
      });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      wx.showToast({
        title: this.data.mode === 'create' ? '创建失败' : '保存失败',
        icon: 'none'
      });
    }
  }
});
