const documentUtils = require('../../utils/document');
const app = getApp(); // 引入 app

Page({
  data: {
    docId: '',
    mode: 'add', // 'add' or 'modify'
    pageTitle: '添加标签', // 页面标题
    allTags: [], // { id, name, color, selected: false }
    selectedTagIds: [], // 存储选中的标签ID
    selectedTags: [], // 存储选中的标签对象 { id, name, color }
    newTagName: '',
    newTagColor: '#1890FF', // 默认颜色
    showColorPanel: false,
    colorOptions: [
      '#FF4D4F', '#FF7A45', '#FFA940', '#FAAD14',
      '#FADB14', '#A0D911', '#52C41A', '#13C2C2',
      '#1890FF', '#2F54EB', '#722ED1', '#EB2F96',
      '#BFBFBF', '#8C8C8C', '#595959', '#262626'
    ],
    theme: 'light', // Add theme state
    fontStyleClass: '' // 添加字体样式类
  },

  onLoad: function (options) {
    const docId = options.docId;
    const mode = options.mode || 'add'; // 默认是添加模式
    const pageTitle = mode === 'modify' ? '修改标签' : '添加标签';

    this.setData({
      docId: docId,
      mode: mode,
      pageTitle: pageTitle
    });

    this.loadAllTags();

    if (docId) {
      this.loadDocumentTags(docId);
    }

    this.updateTheme(); // Update theme on load
    this.applyGlobalFontStyle(); // 应用全局字体样式
  },

  onShow: function() {
    this.updateTheme(); // 页面显示时更新主题
    this.applyGlobalFontStyle(); // 应用全局字体样式
  },

  // 加载所有标签
  loadAllTags: function () {
    const tags = documentUtils.getAllTags();
    this.setData({
      allTags: tags.map(tag => ({ ...tag, selected: false })) // 初始都未选中
    });
  },

  // 加载当前文档的标签，并设置选中状态
  loadDocumentTags: function (docId) {
    const doc = documentUtils.loadDocument(docId);
    if (doc && doc.tags) {
      const currentTagIds = doc.tags;
      this.setData({
        selectedTagIds: [...currentTagIds] // 复制一份当前文档的标签ID
      });
      this.updateTagSelectionStates(); // 更新allTags和selectedTags
    }
  },

  // 根据 selectedTagIds 更新 allTags 的 selected 状态和 selectedTags 数组
  updateTagSelectionStates: function () {
    const selectedTagIds = this.data.selectedTagIds;
    const allTags = this.data.allTags.map(tag => {
      return {
        ...tag,
        selected: selectedTagIds.includes(tag.id)
      };
    });
    const selectedTags = allTags.filter(tag => tag.selected);

    this.setData({
      allTags: allTags,
      selectedTags: selectedTags
    });
  },

  // 切换标签选中状态
  toggleTagSelection: function (e) {
    const tagId = e.currentTarget.dataset.id;
    let selectedTagIds = this.data.selectedTagIds;

    const index = selectedTagIds.indexOf(tagId);
    if (index > -1) {
      // 如果已选中，则移除
      selectedTagIds.splice(index, 1);
    } else {
      // 如果未选中，则添加
      selectedTagIds.push(tagId);
    }

    this.setData({ selectedTagIds: selectedTagIds });
    this.updateTagSelectionStates();
  },

  // 处理新标签名称输入
  onNewTagNameInput: function (e) {
    this.setData({ newTagName: e.detail.value });
  },

  // 显示颜色选择器
  showColorPicker: function () {
    this.setData({ showColorPanel: true });
  },

  // 隐藏颜色选择器
  hideColorPicker: function () {
    this.setData({ showColorPanel: false });
  },

  // 选择颜色
  selectColor: function (e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ newTagColor: color, showColorPanel: false });
  },

  // 创建新标签
  createNewTag: function () {
    const name = this.data.newTagName.trim();
    const color = this.data.newTagColor;

    if (!name) {
      wx.showToast({ title: '标签名称不能为空', icon: 'none' });
      return;
    }
    
    // 检查标签名是否已存在
    const exists = this.data.allTags.some(tag => tag.name === name);
    if (exists) {
      wx.showToast({ title: '标签名称已存在', icon: 'none' });
      return;
    }

    const newTagId = documentUtils.createTag({ name, color });
    if (newTagId) {
      wx.showToast({ title: '标签创建成功', icon: 'success' });
      
      // 添加到 allTags 列表
      const newTag = documentUtils.getTagById(newTagId);
      this.data.allTags.push({ ...newTag, selected: true }); // 新创建的默认选中
      
      // 添加到 selectedTagIds
      this.data.selectedTagIds.push(newTagId);
      
      this.setData({
        allTags: this.data.allTags,
        newTagName: '', // 清空输入框
        selectedTagIds: this.data.selectedTagIds
      });
      this.updateTagSelectionStates(); // 更新界面
    } else {
      wx.showToast({ title: '标签创建失败', icon: 'error' });
    }
  },

  // 保存选择
  saveSelection: function () {
    const docId = this.data.docId;
    const selectedTagIds = this.data.selectedTagIds;

    if (!docId) {
      wx.showToast({ title: '文档ID丢失', icon: 'none' });
      return;
    }

    const doc = documentUtils.loadDocument(docId);
    if (!doc) {
      wx.showToast({ title: '加载文档失败', icon: 'none' });
      return;
    }

    // 更新文档的标签
    doc.tags = selectedTagIds;
    const success = documentUtils.saveDocument(doc);

    if (success) {
      wx.showToast({ title: '标签已更新', icon: 'success' });
      // 返回上一页
      wx.navigateBack();
    } else {
      wx.showToast({ title: '保存失败', icon: 'error' });
    }
  },

  // 更新主题状态
  updateTheme() {
    const currentTheme = app.getCurrentTheme();
    this.setData({ theme: currentTheme });
  },

  // 主题变化回调
  onThemeChange(theme) {
    console.log('Select Tag page received theme change:', theme);
    this.setData({ theme: theme });
  },

  // 应用全局字体样式
  applyGlobalFontStyle: function() {
    const fontStyleClass = app.getGlobalStyleClass();
    this.setData({ fontStyleClass });
    console.log('Select Tag page applying font style:', fontStyleClass);
  },

  // 响应样式变化
  onStyleChange: function() {
    console.log('Select Tag page received style change');
    this.applyGlobalFontStyle();
  },

  // 根据背景色计算合适的文字颜色（黑/白）
  getTextColor: function(bgColor) {
    if (!bgColor) return '#000000'; // 默认黑色
    try {
      // 移除 # 号
      const color = bgColor.charAt(0) === '#' ? bgColor.substring(1, 7) : bgColor;
      // 将16进制转为RGB
      const r = parseInt(color.substring(0, 2), 16); 
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      // 计算亮度 (简单的YIQ公式)
      const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      // 根据亮度返回黑色或白色
      return brightness > 150 ? '#000000' : '#FFFFFF'; 
    } catch (e) {
      return '#000000'; // 出错时返回黑色
    }
  }
}); 