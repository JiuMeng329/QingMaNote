// pages/editor/editor.js

// 导入工具函数
const documentUtils = require('../../utils/document');
const markdownUtils = require('../../utils/markdown');
const editorUtils = require('../../utils/editor');
const { createSpellChecker } = require('../../utils/spellCheck'); // Import spell checker
const { exportMarkdown, exportHTML, exportPDF } = require('../../utils/exportUtil'); // Import export utilities

// 获取应用实例
const app = getApp();

Page({
  data: {
    documentId: '',
    documentTitle: '未命名文档',
    content: '',
    wordCount: 0,
    saveStatus: '已保存',
    showMenu: false,
    // 历史记录，用于撤销和重做
    history: [],
    historyIndex: -1,
    maxHistoryLength: 50,
    // 自动保存计时器
    autoSaveTimer: null,
    // 光标位置
    cursorPosition: {
      start: 0,
      end: 0
    },
    // 实时预览
    livePreview: false,
    renderedContent: '',
    // 编辑模式：'edit'(纯编辑)、'split'(分屏预览)或'preview'(全屏预览)
    editMode: 'edit',
    theme: 'light',
    // --- Spell Check State ---
    spellCheckEnabled: false,
    spellErrors: [],
    showErrorPanel: false,
    selectedErrorWord: null,
    customDictionary: [],
    spellChecker: null, // Spell checker instance
    // --- PDF Export State (New) ---
    pdfRenderContainer_html: '', // Used by exportPDF
    pdfRenderContainer_show: false // Used by exportPDF
  },

  onLoad: function(options) {
    // 获取全局设置
    const globalSettings = app.globalData;
    
    // 设置实时预览状态和编辑模式
    const livePreview = globalSettings.livePreview;
    this.setData({
      livePreview: livePreview,
      editMode: livePreview ? 'split' : 'edit'
    });
    
    if (options.id) {
      // 加载已有文档
      this.setData({
        documentId: options.id
      });
      this.loadDocument(options.id);
    } else if (options.title) {
      // 创建新文档
      this.setData({
        documentTitle: options.title || '未命名文档'
      });
      
      // 创建新文档并保存
      const docId = documentUtils.createDocument({
        title: options.title || '未命名文档',
        content: ''
      });
      
      if (docId) {
        this.setData({
          documentId: docId
        });
      }
    } else {
      // 无参数时创建空白文档
      const docId = documentUtils.createDocument({
        title: '未命名文档',
        content: ''
      });
      
      if (docId) {
        this.setData({
          documentId: docId
        });
      }
    }

    // 初始化历史记录
    this.addToHistory(this.data.content || '');
    
    // 如果启用了实时预览，则渲染内容
    if (this.data.livePreview) {
      this.renderMarkdown();
    }

    // --- Spell Check Initialization ---
    this.setData({ 
      spellCheckEnabled: globalSettings.spellCheck,
      livePreview: globalSettings.livePreview, // Also set livePreview here
      editMode: globalSettings.livePreview ? 'split' : 'edit' // Set initial editMode
    });

    if (this.data.spellCheckEnabled) {
      this.loadCustomDictionary();
      this.initializeSpellChecker();
      // Initial check after loading document
      if (this.data.content) { 
        this.triggerSpellCheck();
      }
    }

    this.updateTheme();
  },

  onShow: function() {
    // 设置自动保存
    this.startAutoSave();
    
    // 检查并应用全局样式更新
    if (app.globalData.styleChanged) {
      this.applyGlobalStyle();
      app.globalData.styleChanged = false; // 重置标识
    }
    
    // 根据最新的全局设置更新编辑模式和实时预览状态 (如果需要)
    const globalSettings = app.globalData;
    const livePreview = globalSettings.livePreview;
    // 只有当 livePreview 设置改变时才调整 editMode
    if (livePreview !== this.data.livePreview) {
        let currentEditMode = this.data.editMode;
        // 如果之前不是分屏/全屏预览，且新设置为开启实时预览，则切换到分屏
        if (currentEditMode === 'edit' && livePreview) {
            currentEditMode = 'split';
        }
        // 如果之前是分屏/全屏预览，且新设置为关闭实时预览，则切换回纯编辑
        else if ((currentEditMode === 'split' || currentEditMode === 'preview') && !livePreview) {
            currentEditMode = 'edit';
        }
        this.setData({
            livePreview: livePreview,
            editMode: currentEditMode
        });
        // 如果切换到了需要预览的模式，则立即渲染
        if (currentEditMode === 'split' || currentEditMode === 'preview') {
            this.renderMarkdown();
        }
    }

    // --- Check for Spell Check Setting Change ---
    const spellCheckSettingChanged = globalSettings.spellCheck !== this.data.spellCheckEnabled;
    if (spellCheckSettingChanged) {
      this.setData({ spellCheckEnabled: globalSettings.spellCheck });
      if (globalSettings.spellCheck) {
        if (!this.data.spellChecker) {
          this.loadCustomDictionary();
          this.initializeSpellChecker();
        }
        this.triggerSpellCheck(); // Trigger check when enabled
      } else {
        this.setData({ spellErrors: [], showErrorPanel: false }); // Clear errors when disabled
        // Optionally destroy the checker instance if memory is a concern
        this.data.spellChecker = null; 
      }
    }

    this.updateTheme();
  },

  onHide: function() {
    // 清除自动保存计时器
    this.clearAutoSave();
    // 保存当前内容
    this.saveDocument();
  },

  onUnload: function() {
    // 清除自动保存计时器
    this.clearAutoSave();
    // 保存当前内容
    this.saveDocument();
  },

  // 加载文档内容
  loadDocument: function(docId) {
    if (!docId) return;
    
    wx.showLoading({
      title: '加载中',
    });

    // 从本地存储加载文档
    const doc = documentUtils.loadDocument(docId);
    
    if (doc) {
      this.setData({
        documentTitle: doc.title,
        content: doc.content,
        wordCount: markdownUtils.countWords(doc.content)
      });
      wx.setNavigationBarTitle({ title: doc.title });

      // 初始化历史记录
      this.addToHistory(doc.content);
      
      // 如果启用了实时预览，则渲染内容
      if (this.data.livePreview) {
        this.renderMarkdown();
      }
      
      // Trigger initial spell check after loading
      if (this.data.spellCheckEnabled) {
        this.triggerSpellCheck();
      }
      
      wx.hideLoading();
    } else {
      wx.hideLoading();
      wx.showToast({
        title: '文档加载失败',
        icon: 'none'
      });
    }
  },

  // 保存文档
  saveDocument: function() {
    // 简单的保存逻辑，可以根据需要添加 forceSave 等
    if (!this.data.documentId) return;
    
    this.setData({
      saveStatus: '保存中...'
    });

    // 保存到本地存储
    const success = documentUtils.saveDocument({
      id: this.data.documentId,
      title: this.data.documentTitle,
      content: this.data.content
      // 注意：这里没有保存 tags，如果编辑器内修改了标签需要加上
    });
    
    this.setData({
      saveStatus: success ? '已保存' : '保存失败'
    });
    
    if (!success) {
      wx.showToast({ title: '文档保存失败', icon: 'none' });
    }
  },

  // 开始自动保存
  startAutoSave: function() {
    this.clearAutoSave(); // 先清除旧的
    // 每30秒自动保存一次
    this.data.autoSaveTimer = setInterval(() => {
      // 只有在编辑中才自动保存，避免不必要的写操作
      if (this.data.saveStatus === '编辑中...'){
         this.saveDocument();
      }
    }, 30000);
  },

  // 清除自动保存
  clearAutoSave: function() {
    if (this.data.autoSaveTimer) {
      clearInterval(this.data.autoSaveTimer);
      this.data.autoSaveTimer = null; // 清除引用
    }
  },

  // 内容变化处理
  onContentChange: function(e) {
    const content = e.detail.value;
    const wordCount = markdownUtils.countWords(content);
    
    this.setData({
      content: content,
      wordCount: wordCount,
      saveStatus: '编辑中...'
    });

    // 添加到历史记录
    this.addToHistory(content);
    
    // 如果启用了实时预览，则渲染内容
    if (this.data.livePreview && this.data.editMode === 'split') {
      this.renderMarkdownDebounced(); // 使用防抖
    }

    // Trigger spell check on change
    this.handleSpellCheckOnChange();
  },
  
  // 跟踪光标位置 (用于 Markdown 插入)
  onTextareaCursor: function(e) {
    if (e.detail && e.detail.cursor !== undefined) {
      this.setData({
        'cursorPosition.start': e.detail.cursor,
        'cursorPosition.end': e.detail.cursor
      });
    }
  },
  
  // // 选择文本时记录选择范围 (如果需要精确插入)
  // onTextareaSelect: function(e) {
  //   if (e.detail) {
  //     this.setData({
  //       'cursorPosition.start': e.detail.selectionStart,
  //       'cursorPosition.end': e.detail.selectionEnd
  //     });
  //   }
  // },
  
  // 渲染Markdown内容
  renderMarkdown: function() {
     if (!this.data.livePreview || (this.data.editMode !== 'split' && this.data.editMode !== 'preview')) {
         this.setData({ renderedContent: '' });
         return;
     }
    if (!this.data.content) {
      this.setData({ renderedContent: '' });
      return;
    }
    const html = markdownUtils.markdownToHtml(this.data.content);
    this.setData({ renderedContent: html });
  },

  // Markdown 渲染防抖
  renderMarkdownDebounced: function() {
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    this.renderTimeout = setTimeout(() => {
      this.renderMarkdown();
    }, 300);
  },

  // 添加到历史记录 (简单实现)
  addToHistory: function(content) {
    const history = this.data.history;
    const historyIndex = this.data.historyIndex;
    if (historyIndex < history.length - 1) {
      history.splice(historyIndex + 1);
    }
    if (history.length > 0 && content === history[history.length - 1]) {
      return;
    }
    history.push(content);
    if (history.length > this.data.maxHistoryLength) {
      history.shift();
    }
    this.setData({ history: history, historyIndex: history.length - 1 });
  },

  // 撤销编辑
  undoEdit: function() {
    if (this.data.historyIndex > 0) {
      const newIndex = this.data.historyIndex - 1;
      const content = this.data.history[newIndex];
      this.setData({
        content: content,
        historyIndex: newIndex,
        wordCount: markdownUtils.countWords(content),
        saveStatus: '编辑中...'
      });
       if (this.data.livePreview && this.data.editMode === 'split') {
         this.renderMarkdown();
       }
    }
  },

  // 重做编辑
  redoEdit: function() {
    if (this.data.historyIndex < this.data.history.length - 1) {
      const newIndex = this.data.historyIndex + 1;
      const content = this.data.history[newIndex];
      this.setData({
        content: content,
        historyIndex: newIndex,
        wordCount: markdownUtils.countWords(content),
        saveStatus: '编辑中...'
      });
      if (this.data.livePreview && this.data.editMode === 'split') {
         this.renderMarkdown();
       }
    }
  },

  // 格式化文本 (示例，依赖 editorUtils)
  formatText: function(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'image') {
        this.chooseImage();
        return;
    }
    const { content, cursorPosition } = this.data;
    // 调用 editorUtils 处理插入逻辑
    const { newContent } = editorUtils.insertMarkdownSyntax(content, cursorPosition, type);
    if (newContent !== content) {
        this.setData({ content: newContent, saveStatus: '编辑中...' });
        this.addToHistory(newContent);
         if (this.data.livePreview && this.data.editMode === 'split') {
            this.renderMarkdownDebounced();
        }
    }
  },
  
  // 选择图片 (示例)
  chooseImage: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        // TODO: 上传图片到服务器或云存储，获取 URL
        const imageUrl = tempFilePath; // 暂时使用本地路径
        
        // 插入图片 Markdown
        const { content, cursorPosition } = this.data;
        const imageMarkdown = `![图片](${imageUrl})`;
        const { newContent } = editorUtils.insertText(content, cursorPosition.start, imageMarkdown);
        
        this.setData({ content: newContent, saveStatus: '编辑中...' });
        this.addToHistory(newContent);
         if (this.data.livePreview && this.data.editMode === 'split') {
            this.renderMarkdownDebounced();
        }
      }
    });
  },

  // 切换预览模式
  switchToPreview: function() {
    const currentMode = this.data.editMode;
    let nextMode = 'edit';
    if (currentMode === 'edit') {
      nextMode = this.data.livePreview ? 'split' : 'preview';
    } else if (currentMode === 'split') {
      nextMode = 'preview';
    } // 从 preview 切换回 edit

    this.setData({ editMode: nextMode });
    // 切换到预览相关模式时渲染
    if (nextMode === 'split' || nextMode === 'preview') {
        this.renderMarkdown();
    }
  },

  // 显示更多菜单
  showMoreMenu: function() {
    this.setData({ showMenu: true });
  },
  
  // 隐藏更多菜单
  hideMoreMenu: function() {
    this.setData({ showMenu: false });
  },
  
  // 分享文档 (占位)
  shareDocument: function() {
    this.hideMoreMenu();
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
     wx.showToast({ title: '请点击右上角分享', icon: 'none' });
  },

  // 导出为 Markdown (复制到剪贴板)
  exportAsMD: function() {
    this.hideMoreMenu();
    const filename = `${this.data.documentTitle || 'document'}.md`;
    exportMarkdown(this.data.content, filename); // Use util function
  },
  
  // 导出为 HTML (复制到剪贴板)
  exportAsHTML: function() {
    this.hideMoreMenu();
    const filename = `${this.data.documentTitle || 'document'}.html`;
    exportHTML(this.data.content, this.data.documentTitle, filename); // Use util function
  },
  
  // 导出为 PDF (占位)
  exportAsPDF: function() {
    this.hideMoreMenu();
    wx.showLoading({ title: '生成中...', mask: true });
    const filename = `${this.data.documentTitle || 'document'}.pdf`; // Filename for the saved PNG
    const renderContainerId = 'pdf-render-container';
    
    // 确保初始化渲染容器的数据
    const initData = {};
    initData[`${renderContainerId}_html`] = '';
    initData[`${renderContainerId}_show`] = false;
    this.setData(initData);
    
    // Call the exportPDF utility function, passing the page instance (`this`)
    exportPDF(this.data.content, this, renderContainerId, filename)
      .then(savedPath => {
        console.log('PDF (image) exported to:', savedPath);
        // Optionally open the saved image file
        // wx.openDocument({ filePath: savedPath, showMenu: true });
      })
      .catch(err => {
        console.error('PDF 导出失败:', err);
        wx.showToast({ title: typeof err === 'string' ? err : 'PDF导出失败', icon: 'error' });
      })
      .finally(() => {
        wx.hideLoading();
        // 确保使用动态key隐藏渲染容器
        const hideData = {};
        hideData[`${renderContainerId}_show`] = false;
        this.setData(hideData);
      });
  },
  
  // 导出为 Word (占位)
  exportAsWord: function() {
    this.hideMoreMenu();
    wx.showToast({ title: '导出Word功能开发中', icon: 'none' });
  },
  
  // 修改标签 (跳转到标签选择页)
  modifyTags: function() {
    this.hideMoreMenu();
    wx.navigateTo({
      // 添加 mode=modify 参数以区分
      url: `/pages/tag/select-tag?docId=${this.data.documentId}&mode=modify`
    });
  },

  // 添加标签 (跳转到标签选择页)
  addTag: function() {
    this.hideMoreMenu();
    // 跳转到标签选择/创建页 (mode 默认为 add)
     wx.navigateTo({
       url: `/pages/tag/select-tag?docId=${this.data.documentId}`
     });
  },

  // 查看历史版本 (占位)
  viewHistory: function() {
    this.hideMoreMenu();
    wx.showToast({ title: '历史版本功能开发中', icon: 'none' });
  },
  
  // --- 页面事件处理 ---
  // 允许页面分享
  onShareAppMessage: function() {
    return {
      title: this.data.documentTitle || '分享文档',
      path: '/pages/editor/editor?id=' + this.data.documentId
    };
  },
  
  onShareTimeline: function() {
    return {
      title: this.data.documentTitle || '分享文档',
      query: 'id=' + this.data.documentId
    };
  },

  // 应用全局样式
  applyGlobalStyle: function() {
    const app = getApp();
    const globalStyleClass = app.getGlobalStyleClass();
    this.setData({ globalStyleClass: globalStyleClass }); 
    console.log('Editor page applying global style:', globalStyleClass);
  },

  // 更新主题状态
  updateTheme() {
    this.setData({ theme: app.getCurrentTheme() });
    // Potentially update navigation bar color based on theme?
  },

  // 主题变化回调
  onThemeChange(theme) {
    console.log('Editor page received theme change:', theme);
    this.setData({ theme: theme });
    // Potentially update navigation bar color based on theme?
  },

  // --- Spell Check Methods ---
  initializeSpellChecker() {
    console.log('Initializing spell checker with custom dictionary:', this.data.customDictionary);
    this.data.spellChecker = createSpellChecker(this.data.customDictionary);
  },

  loadCustomDictionary() {
    try {
      const dict = wx.getStorageSync('customDictionary') || [];
      this.setData({ customDictionary: dict });
    } catch (e) {
      console.error('Failed to load custom dictionary', e);
      this.setData({ customDictionary: [] });
    }
  },

  saveCustomDictionary() {
    try {
      wx.setStorageSync('customDictionary', this.data.customDictionary);
    } catch (e) {
      console.error('Failed to save custom dictionary', e);
    }
  },

  triggerSpellCheck() {
    if (this.data.spellCheckEnabled && this.data.spellChecker) {
      console.log('Triggering spell check...');
      this.data.spellChecker.check(this.data.content, (errors) => {
        console.log('Spell check completed. Errors:', errors);
        this.setData({ spellErrors: errors });
        // Optionally show panel if errors exist
        // if (errors.length > 0 && !this.data.showErrorPanel) {
        //   this.setData({ showErrorPanel: true });
        // }
      });
    }
  },
  
  // Called from onContentChange
  handleSpellCheckOnChange() {
     if (this.data.spellCheckEnabled && this.data.spellChecker) {
       this.triggerSpellCheck(); // Use the debounced check from the checker
     }
  },

  toggleErrorPanel() {
    this.setData({ showErrorPanel: !this.data.showErrorPanel });
  },

  showWordActions(e) {
    const word = e.currentTarget.dataset.word;
    this.setData({ selectedErrorWord: word });
    wx.showActionSheet({
      itemList: ['添加到词典'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.addToDictionary();
        }
      },
      fail: () => {
        this.setData({ selectedErrorWord: null });
      }
    });
  },

  addToDictionary() {
    const word = this.data.selectedErrorWord;
    if (word && this.data.spellChecker) {
      // Add to checker instance
      this.data.spellChecker.addWords([word]);
      // Add to local data and save
      const newDict = [...this.data.customDictionary, word];
      this.setData({ 
        customDictionary: newDict,
        selectedErrorWord: null // Clear selection
      });
      this.saveCustomDictionary();
      // Re-trigger check to remove the error from list
      this.triggerSpellCheck(); 
    } else {
      this.setData({ selectedErrorWord: null });
    }
  },
})