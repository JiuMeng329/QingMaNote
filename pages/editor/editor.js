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
    pdfRenderContainer_show: false, // Used by exportPDF
    lineHeight: 0,
    lineCount: 0
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
    } else if (options.source === 'import') {
      // 处理从导入页面过来的内容
      const importedContent = app.globalData.importedMarkdown || '';
      const filename = options.filename ? decodeURIComponent(options.filename) : '导入文档.md';
      const title = filename.replace(/\.md$|\.markdown$/i, '');
      
      this.setData({
        documentTitle: title,
        content: importedContent
      });
      
      // 创建新文档并保存导入内容
      const docId = documentUtils.createDocument({
        title: title,
        content: importedContent
      });
      
      if (docId) {
        this.setData({
          documentId: docId
        });
        
        // 计算字数
        this.updateWordCount(importedContent);
        
        // 添加到历史记录
        this.addToHistory(importedContent);
        
        // 如果启用了拼写检查，则触发检查
        if (this.data.spellCheckEnabled && this.data.spellChecker) {
          this.triggerSpellCheck();
        }
        
        // 如果启用了实时预览，渲染内容
        if (this.data.livePreview) {
          this.renderMarkdown();
        }
        
        wx.showToast({
          title: '导入成功',
          icon: 'success'
        });
      }
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
  
  // 更新字数统计
  updateWordCount: function(content) {
    if (!content) return 0;
    const wordCount = markdownUtils.countWords(content);
    this.setData({ wordCount: wordCount });
    return wordCount;
  },
  
  // 跟踪光标位置 (用于 Markdown 插入)
  onTextareaCursor: function(e) {
    if (e.detail && e.detail.cursor !== undefined) {
      this.setData({
        cursorPosition: {
          start: e.detail.cursor,
          end: e.detail.cursor
        }
      });
    }
  },
  
  // 文本区域获得焦点时触发
  onTextareaFocus: function(e) {
    // 这里可以添加获取焦点相关逻辑
    console.log('Textarea focused');
  },

  // 文本区域失去焦点时触发
  onTextareaBlur: function(e) {
    // 在失去焦点时保存文档
    this.saveDocument();
  },

  // 文本区域行号变化时触发
  onTextareaLineChange: function(e) {
    // 更新行号，可用于精确定位光标
    console.log('Line changed:', e.detail);
    if (e.detail && e.detail.lineHeight !== undefined) {
      this.data.lineHeight = e.detail.lineHeight;
    }
    if (e.detail && e.detail.lineCount !== undefined) {
      this.data.lineCount = e.detail.lineCount;
    }
    if (e.detail && e.detail.selectionStart !== undefined && e.detail.selectionEnd !== undefined) {
      this.setData({
        cursorPosition: {
          start: e.detail.selectionStart,
          end: e.detail.selectionEnd
        }
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
    
    // 特殊处理代码块，可以选择语言
    if (type === 'codeblock') {
        const { content, cursorPosition } = this.data;
        
        wx.showActionSheet({
          itemList: ['普通代码块', 'JavaScript', 'Python', 'HTML', 'CSS', 'Java', 'C++', 'Go', 'SQL'],
          success: (res) => {
            let codeBlockPrefix = '```\n';
            if (res.tapIndex > 0) {
              // 选择了特定语言
              const languages = ['', 'javascript', 'python', 'html', 'css', 'java', 'cpp', 'go', 'sql'];
              codeBlockPrefix = '```' + languages[res.tapIndex] + '\n';
            }
            
            // 插入代码块
            const selectedText = content.substring(cursorPosition.start, cursorPosition.end);
            const newContent = content.substring(0, cursorPosition.start) + 
                             codeBlockPrefix + 
                             selectedText + 
                             '\n```' + 
                             content.substring(cursorPosition.end);
            
            const newCursorPos = {
              start: cursorPosition.start + codeBlockPrefix.length,
              end: cursorPosition.start + codeBlockPrefix.length + selectedText.length
            };
            
            this.setData({ 
              content: newContent, 
              cursorPosition: newCursorPos,
              saveStatus: '编辑中...' 
            });
            this.addToHistory(newContent);
            if (this.data.livePreview && this.data.editMode === 'split') {
              this.renderMarkdownDebounced();
            }
          }
        });
        return;
    }
    
    const { content, cursorPosition } = this.data;
    // 调用 editorUtils 处理插入逻辑
    const { newContent, selection } = editorUtils.insertMarkdownSyntax(content, cursorPosition, type);
    if (newContent !== content) {
        this.setData({ 
            content: newContent, 
            cursorPosition: selection || cursorPosition, 
            saveStatus: '编辑中...' 
        });
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
  
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    // 确保文档数据已更新
    this.saveDocument();
    
    const title = this.data.documentTitle || 'MarkMark文档';
    const content = this.data.content || '';
    // 获取内容摘要（前100个字符）
    const description = content.length > 100 ? content.substring(0, 100) + '...' : content;
    
    return {
      title: title,
      desc: description,
      path: `/pages/document/document?id=${this.data.documentId}`,
      imageUrl: '/images/share-default-image.png'
    };
  },
  
  /**
   * 用户点击右上角分享到朋友圈
   */
  onShareTimeline: function () {
    // 确保文档数据已更新
    this.saveDocument();
    
    const title = this.data.documentTitle || 'MarkMark文档';
    // 朋友圈分享描述更短
    const content = this.data.content || '';
    const description = content.length > 50 ? content.substring(0, 50) + '...' : content;
    
    return {
      title: `${title} - ${description}`,
      query: `id=${this.data.documentId}&source=timeline`,
      imageUrl: '/images/share-default-image.png'
    };
  },
  
  /**
   * 显示更多操作菜单
   */
  showMoreOptions: function() {
    const that = this;
    wx.showActionSheet({
      itemList: ['拼写检查', '导出PDF', '导出Markdown', '导出HTML', '导出Word', '分享文档'],
      success: function(res) {
        switch (res.tapIndex) {
          case 0: // 拼写检查
            that.toggleSpellCheck();
            break;
          case 1: // 导出PDF
            wx.showLoading({ title: '导出PDF中...' });
            that.exportAsPDF();
            break;
          case 2: // 导出Markdown
            wx.showLoading({ title: '导出Markdown中...' });
            that.exportAsMD();
            break;
          case 3: // 导出HTML
            wx.showLoading({ title: '导出HTML中...' });
            that.exportAsHTML();
            break;
          case 4: // 导出Word
            wx.showLoading({ title: '导出Word中...' });
            that.exportAsWord();
            break;
          case 5: // 分享文档
            that.shareDocument();
            break;
        }
      }
    });
  },
  
  /**
   * 分享文档
   */
  shareDocument: function() {
    const that = this;
    wx.showActionSheet({
      itemList: ['生成分享图片', '分享到聊天', '分享到朋友圈'],
      success: function(res) {
        switch (res.tapIndex) {
          case 0: // 生成分享图片
            that.generateShareImage();
            break;
          case 1: // 分享到聊天
            wx.showShareMenu({
              withShareTicket: true,
              menus: ['shareAppMessage']
            });
            wx.showToast({
              title: '请点击右上角分享给朋友',
              icon: 'none',
              duration: 2000
            });
            break;
          case 2: // 分享到朋友圈
            wx.showShareMenu({
              withShareTicket: true,
              menus: ['shareTimeline']
            });
            wx.showToast({
              title: '请点击右上角分享到朋友圈',
              icon: 'none',
              duration: 2000
            });
            break;
        }
      }
    });
  },
  
  /**
   * 生成分享图片
   */
  generateShareImage: function() {
    const that = this;
    wx.showLoading({ title: '生成分享图片中...' });
    
    // 创建离屏canvas
    const canvas = wx.createOffscreenCanvas({
      type: '2d', 
      width: 750, 
      height: 1000
    });
    
    // 获取2d上下文
    const ctx = canvas.getContext('2d');
    
    // 设置画布大小
    const canvasWidth = 750;
    const canvasHeight = 1000;
    
    // 绘制背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制标题区域背景
    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(0, 0, canvasWidth, 160);
    
    // 绘制标题
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    const title = this.data.documentTitle || 'MarkMark文档';
    ctx.fillText(title, canvasWidth / 2, 100);
    
    // 绘制内容预览
    ctx.font = '30px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'left';
    
    // 获取内容摘要
    const content = this.data.content || '空文档';
    const previewLines = content.split('\n').slice(0, 10);
    let y = 200;
    
    previewLines.forEach((line, index) => {
      if (index < 8) {
        // 限制每行长度
        const displayLine = line.length > 26 ? line.substring(0, 26) + '...' : line;
        ctx.fillText(displayLine, 50, y);
        y += 60;
      } else if (index === 8) {
        ctx.fillText('...', 50, y);
      }
    });
    
    // 绘制底部信息
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'center';
    ctx.fillText('由MarkMark生成的Markdown文档', canvasWidth / 2, canvasHeight - 100);
    ctx.fillText('打开小程序查看完整内容', canvasWidth / 2, canvasHeight - 50);
    
    // 添加小程序码或应用图标
    const logoSize = 80;
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(canvasWidth / 2, canvasHeight - 200, logoSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 导出图片
    try {
      // 从离屏Canvas导出图片
      const tempFilePath = `${wx.env.USER_DATA_PATH}/share_${Date.now()}.png`;
      const buffer = canvas.toDataURL({
        fileType: 'png',
        quality: 1
      });
      
      // 保存图片到本地文件系统
      const fs = wx.getFileSystemManager();
      fs.writeFileSync(
        tempFilePath,
        buffer.replace(/^data:image\/\w+;base64,/, ""),
        'base64'
      );
      
      // 保存到相册
      wx.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: function() {
          wx.hideLoading();
          wx.showToast({
            title: '分享图片已保存到相册',
            icon: 'success'
          });
        },
        fail: function(err) {
          wx.hideLoading();
          console.error('保存图片失败:', err);
          
          // 提示用户授权保存图片
          if (err.errMsg.indexOf('auth deny') >= 0 || err.errMsg.indexOf('authorize') >= 0) {
            wx.showModal({
              title: '提示',
              content: '需要您授权保存图片到相册',
              confirmText: '去授权',
              success(modalRes) {
                if (modalRes.confirm) {
                  wx.openSetting({
                    success(settingRes) {
                      if (settingRes.authSetting['scope.writePhotosAlbum']) {
                        wx.showToast({
                          title: '授权成功，请重新保存',
                          icon: 'none'
                        });
                      } else {
                        wx.showToast({
                          title: '授权失败，无法保存图片',
                          icon: 'none'
                        });
                      }
                    }
                  });
                }
              }
            });
          } else {
            wx.showToast({
              title: '保存失败，请重试',
              icon: 'none'
            });
          }
        }
      });
    } catch (err) {
      wx.hideLoading();
      console.error('生成分享图片失败:', err);
      wx.showToast({
        title: '生成图片失败',
        icon: 'none'
      });
    }
  },
  
  /**
   * 导出为Markdown文件并分享
   */
  exportAsMD: function() {
    const that = this;
    // 确保文档已保存
    this.saveDocument();
    
    const exportUtil = require('../../utils/exportUtil');
    const title = that.data.documentTitle || 'document';
    const content = that.data.content || '';
    const filename = `${title}.md`;
    
    // 使用导出工具
    exportUtil.exportMarkdown(content, filename)
      .then(filePath => {
        wx.hideLoading();
        console.log('Markdown文件导出成功:', filePath);
      })
      .catch(error => {
        wx.hideLoading();
        console.error('Markdown导出失败:', error);
        let errorMsg = '导出失败';
        
        // 提供更具体的错误信息
        if (error && error.message) {
          if (error.message.includes('权限被拒绝')) {
            errorMsg = '权限被拒绝，无法保存';
          } else if (error.message.includes('不存在')) {
            errorMsg = '文件创建失败';
          } else if (error.message.includes('不支持的操作')) {
            errorMsg = '操作不支持，请更新微信';
          } else {
            errorMsg = error.message.substring(0, 20); // 取部分错误信息显示
          }
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      });
  },
  
  /**
   * 导出为HTML文件并分享
   */
  exportAsHTML: function() {
    const that = this;
    // 确保文档已保存
    this.saveDocument();
    
    const exportUtil = require('../../utils/exportUtil');
    const title = that.data.documentTitle || 'document';
    const content = that.data.content || '';
    const filename = `${title}.html`;
    
    // 使用导出工具
    exportUtil.exportHTML(content, title, filename)
      .then(filePath => {
        wx.hideLoading();
        console.log('HTML文件导出成功:', filePath);
      })
      .catch(error => {
        wx.hideLoading();
        console.error('HTML导出失败:', error);
        let errorMsg = '导出失败';
        
        // 提供更具体的错误信息
        if (error && error.message) {
          if (error.message.includes('权限被拒绝')) {
            errorMsg = '权限被拒绝，无法保存';
          } else if (error.message.includes('不存在')) {
            errorMsg = '文件创建失败';
          } else if (error.message.includes('不支持的操作')) {
            errorMsg = '操作不支持，请更新微信';
          } else {
            errorMsg = error.message.substring(0, 20); // 取部分错误信息显示
          }
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      });
  },

  // 导出为 PDF
  exportAsPDF: function() {
    this.hideMoreMenu();
    wx.showLoading({ title: '准备文档...', mask: true });
    
    // 确保文档已保存
    this.saveDocument();
    
    const filename = `${this.data.documentTitle || 'document'}.pdf`; // Filename for the saved PNG
    const renderContainerId = 'pdf-render-container';
    
    // 确保初始化渲染容器的数据
    const initData = {};
    initData[`${renderContainerId}_html`] = '';
    initData[`${renderContainerId}_show`] = false;
    this.setData(initData, () => {
      try {
        // 引入导出工具
        const { exportPDF } = require('../../utils/exportUtil');
        
        // 在下一个渲染周期调用导出函数
        setTimeout(() => {
          // 调用导出PDF函数
          exportPDF(this.data.content, this, renderContainerId, filename)
            .then(savedPath => {
              console.log('PDF (image) exported to:', savedPath);
              wx.hideLoading();
            })
            .catch(err => {
              console.error('PDF 导出失败:', err);
              wx.hideLoading();
              let errorMsg = '导出失败';
              
              // 提供更具体的错误信息
              if (typeof err === 'string') {
                errorMsg = err.length > 20 ? err.substring(0, 20) + '...' : err;
              } else if (err && err.message) {
                errorMsg = err.message.length > 20 ? err.message.substring(0, 20) + '...' : err.message;
              }
              
              wx.showToast({ 
                title: errorMsg, 
                icon: 'none',
                duration: 2000
              });
            });
        }, 300);
      } catch (error) {
        console.error('准备PDF导出时出错:', error);
        wx.hideLoading();
        wx.showToast({
          title: '导出初始化失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 导出为 Word
  exportAsWord: function() {
    this.hideMoreMenu();
    wx.showLoading({ title: '导出Word中...', mask: true });
    
    // 确保文档已保存
    this.saveDocument();
    
    const exportUtil = require('../../utils/exportUtil');
    const title = this.data.documentTitle || 'document';
    const content = this.data.content || '';
    const filename = `${title}.docx`;
    
    // 使用导出工具
    exportUtil.exportWord(content, title, filename)
      .then(filePath => {
        // 隐藏loading是在exportWord内部处理的
        console.log('Word文件导出成功:', filePath);
      })
      .catch(error => {
        wx.hideLoading();
        console.error('Word导出失败:', error);
        let errorMsg = '导出失败';
        
        // 提供更具体的错误信息
        if (error && error.message) {
          if (error.message.includes('权限被拒绝')) {
            errorMsg = '权限被拒绝，无法保存';
          } else if (error.message.includes('不存在')) {
            errorMsg = '文件创建失败';
          } else if (error.message.includes('不支持的操作')) {
            errorMsg = '操作不支持，请更新微信';
          } else {
            errorMsg = error.message.substring(0, 20); // 取部分错误信息显示
          }
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      });
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
  
  // 应用全局样式
  applyGlobalStyle: function() {
    const app = getApp();
    const globalStyleClass = app.getGlobalStyleClass();
    this.setData({ globalStyleClass: globalStyleClass }); 
    console.log('Editor page applying global style:', globalStyleClass);
  },

  // 更新主题状态
  updateTheme() {
    const currentTheme = app.getCurrentTheme();
    this.setData({ theme: currentTheme });
    
    // 更新导航栏组件主题
    this.updateNavBarComponentTheme(currentTheme);
    
    // 根据主题更新导航栏颜色
    this.updateNavBarStyle(currentTheme);
  },

  // 主题变化回调
  onThemeChange(theme) {
    console.log('Editor page received theme change:', theme);
    this.setData({ theme: theme });
    
    // 更新导航栏组件主题
    this.updateNavBarComponentTheme(theme);
    
    // 根据主题更新导航栏颜色
    this.updateNavBarStyle(theme);
  },
  
  // 更新导航栏组件主题
  updateNavBarComponentTheme(theme) {
    const navBar = this.selectComponent('navigation-bar');
    if (navBar && typeof navBar.onThemeChange === 'function') {
      navBar.onThemeChange(theme);
    }
  },

  // 根据主题更新导航栏样式
  updateNavBarStyle(theme) {
    let frontColor = '#000000';
    let backgroundColor = '#FFFFFF';
    
    if (theme === 'dark') {
      frontColor = '#FFFFFF';
      backgroundColor = '#1E1E1E';
    } else if (theme === 'github') {
      frontColor = '#c9d1d9';
      backgroundColor = '#161b22';
    }
    
    wx.setNavigationBarColor({
      frontColor: frontColor,
      backgroundColor: backgroundColor,
      animation: {
        duration: 300,
        timingFunc: 'easeInOut'
      }
    });
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