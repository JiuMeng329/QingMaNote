Page({
  data: {
    importProgress: 0,
    importStatus: '',
    showProgress: false,
    fileInfo: null,
    theme: 'light',
    fontStyleClass: ''
  },

  onLoad: function() {
    const app = getApp();
    this.updateTheme();
    this.applyGlobalFontStyle();
  },

  onShow: function() {
    this.updateTheme();
    this.applyGlobalFontStyle();
  },

  updateTheme() {
    const app = getApp();
    if (app.getCurrentTheme) {
      this.setData({ theme: app.getCurrentTheme() });
    }
  },

  onThemeChange(theme) {
    console.log('Import page received theme change:', theme);
    this.setData({ theme: theme });
  },

  applyGlobalFontStyle: function() {
    const app = getApp();
    const fontStyleClass = app.getGlobalStyleClass();
    this.setData({ fontStyleClass });
    console.log('Import page applying font style:', fontStyleClass);
  },

  onStyleChange: function() {
    console.log('Import page received style change');
    this.applyGlobalFontStyle();
  },

  // 显示导入选项
  showImportOptions() {
    wx.showActionSheet({
      itemList: ['从微信聊天记录导入', '从本地文件导入'],
      success: (res) => {
        console.log('用户选择的索引:', res.tapIndex);
        if (res.tapIndex === 0) {
          // 从聊天记录导入
          this.importFromChat();
        } else if (res.tapIndex === 1) {
          // 从手机文件导入
          wx.showModal({
            title: '文件选择提示',
            content: '在微信小程序中，所有文件选择都将通过聊天记录选择器进行。请在接下来的界面中选择您的Markdown文件。',
            confirmText: '继续',
            success: (res) => {
              if (res.confirm) {
                this.importFromLocal();
              }
            }
          });
        }
      },
      fail: (res) => {
        console.log('用户取消选择', res);
      }
    });
  },

  // 尝试从本地文件导入（处理不同微信版本的兼容性）
  tryImportFromLocal() {
    console.log('尝试从手机文件导入');
    
    // 首先检查是否支持从文件导入的API
    if (typeof wx.chooseFile === 'function') {
      // 如果支持旧版API，使用它
      this.importFromLocalLegacy();
    } else {
      // 否则使用 chooseMessageFile 并尝试模拟文件导入
      this.importFromLocal();
    }
  },
  
  // 从本地文件导入 - 旧版本API（已废弃，但某些设备可能仍支持）
  importFromLocalLegacy() {
    console.log('使用旧版API导入文件');
    this.startImportProcess('正在从手机选择文件...');
    
    try {
      wx.chooseFile({
        count: 1,
        type: 'file',
        extension: ['md', 'markdown'],
        success: (res) => {
          console.log('旧版API选择文件成功:', res.tempFiles[0].name);
          this.handleFileSelected(res.tempFiles[0]);
        },
        fail: (err) => {
          console.error('旧版API选择文件失败:', err);
          // 如果旧版API失败，尝试使用新版API
          this.importFromLocal();
        }
      });
    } catch (e) {
      console.error('旧版API不受支持，切换到新版:', e);
      this.importFromLocal();
    }
  },

  // 从聊天记录导入
  importFromChat() {
    console.log('执行从聊天记录导入');
    this.startImportProcess('正在从聊天记录选择文件...');
    
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['.md', '.markdown'],
      success: (res) => {
        console.log('从聊天记录选择文件成功:', res.tempFiles[0].name);
        this.handleFileSelected(res.tempFiles[0]);
      },
      fail: (err) => {
        console.error('从聊天记录选择文件失败:', err);
        this.handleImportError('选择文件失败', err);
      }
    });
  },

  // 从本地文件导入 - 标准方法
  importFromLocal() {
    console.log('执行从手机文件导入');
    this.startImportProcess('正在从手机选择文件...');
    
    try {
      // 尝试使用更明确的参数配置
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['md', 'markdown'], 
        success: (res) => {
          console.log('从手机文件选择成功:', res.tempFiles[0].name);
          this.handleFileSelected(res.tempFiles[0]);
        },
        fail: (err) => {
          console.error('从手机文件选择失败:', err);
          this.handleImportError('选择文件失败，请尝试从聊天记录导入', err);
        }
      });
    } catch (e) {
      console.error('选择文件API错误:', e);
      this.handleImportError('您的微信版本可能不支持此功能，请尝试从聊天记录导入');
    }
  },

  // 处理选择的文件
  handleFileSelected(file) {
    if (!file) {
      this.handleImportError('未能获取文件信息');
      return;
    }
    
    console.log('处理选中的文件:', file.name, '大小:', file.size);
    
    this.setData({
      fileInfo: {
        name: file.name,
        size: this.formatFileSize(file.size),
        path: file.path
      },
      importStatus: '准备读取文件...',
      importProgress: 20
    });
    
    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) {
      this.handleImportError('文件不能超过10MB');
      return;
    }
    
    // 检查文件扩展名
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (fileExt !== '.md' && fileExt !== '.markdown') {
      this.handleImportError(`不支持的文件格式: ${fileExt}，请选择.md或.markdown文件`);
      return;
    }
    
    this.readFileContent(file.path);
  },

  // 读取文件内容
  readFileContent(filePath) {
    this.setData({ 
      importStatus: '正在读取文件...',
      importProgress: 40 
    });
    
    // 确保路径存在
    if (!filePath) {
      this.handleImportError('文件路径无效');
      return;
    }
    
    const fs = wx.getFileSystemManager();
    fs.access({
      path: filePath,
      success: () => {
        // 文件存在，继续读取
        fs.readFile({
          filePath,
          encoding: 'utf-8',
          success: (res) => {
            this.setData({ importProgress: 70 });
            this.processMarkdownContent(res.data);
          },
          fail: (err) => {
            console.error('读取文件失败:', err);
            this.handleImportError('读取文件失败，请重试');
          }
        });
      },
      fail: (err) => {
        console.error('文件访问失败:', err);
        this.handleImportError('无法访问文件，可能是临时文件已过期');
      }
    });
  },

  // 处理Markdown内容
  processMarkdownContent(content) {
    this.setData({ 
      importStatus: '正在处理内容...',
      importProgress: 90 
    });
    
    // 预处理内容
    content = this.preprocessContent(content);
    
    // 简单验证
    if (!this.isValidMarkdown(content)) {
      this.handleImportError('文件内容不是有效的Markdown格式');
      return;
    }
    
    // 保存到全局
    getApp().globalData.importedMarkdown = content;
    
    // 导入完成
    this.setData({ 
      importProgress: 100,
      importStatus: '导入完成' 
    });
    
    // 跳转到编辑器
    setTimeout(() => {
      wx.navigateTo({
        url: `/pages/editor/editor?source=import&filename=${encodeURIComponent(this.data.fileInfo.name)}`,
        success: () => {
          console.log('成功跳转到编辑器');
        },
        fail: (err) => {
          console.error('跳转到编辑器失败:', err);
          // 如果导航失败，尝试使用redirectTo
          wx.redirectTo({
            url: `/pages/editor/editor?source=import&filename=${encodeURIComponent(this.data.fileInfo.name)}`,
            fail: (redirectErr) => {
              console.error('重定向到编辑器也失败:', redirectErr);
              wx.showToast({
                title: '跳转失败，但文件已导入',
                icon: 'none',
                duration: 2000
              });
            }
          });
        }
      });
    }, 500);
  },

  // 预处理内容
  preprocessContent(content) {
    // 统一换行符
    content = content.replace(/\r\n/g, '\n');
    // 移除BOM头
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    // 替换制表符
    content = content.replace(/\t/g, '    ');
    return content.trim();
  },

  // 简单验证Markdown
  isValidMarkdown(content) {
    if (!content || content.length === 0) return false;
    // 检查常见Markdown标记
    const mdPatterns = /^#|^-|^`|^\[|^!\[|^\*|^>/;
    return mdPatterns.test(content);
  },

  // 开始导入流程
  startImportProcess(status) {
    this.setData({
      showProgress: true,
      importProgress: 0,
      importStatus: status,
      fileInfo: null
    });
  },

  // 处理导入错误
  handleImportError(message, err = null) {
    console.error('导入错误:', message, err);
    
    // 更具体的错误处理
    let errorMessage = message;
    if (err) {
      if (err.errMsg) {
        if (err.errMsg.includes('user cancel')) {
          errorMessage = '用户取消操作';
          console.log('用户取消导入操作');
          // 用户取消不显示错误
          this.setData({
            importStatus: '已取消',
            importProgress: 0,
            showProgress: false
          });
          return;
        } else if (err.errMsg.includes('permission')) {
          errorMessage = '权限不足，无法访问文件';
        }
      }
    }
    
    // 重置进度
    this.setData({
      importStatus: errorMessage,
      importProgress: 0
    });
    
    // 显示错误消息
    wx.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 2000
    });
    
    // 延迟隐藏进度条
    setTimeout(() => {
      this.setData({ showProgress: false });
      
      // 如果是严重错误，可以提供返回选项
      if (err && (err.errMsg && err.errMsg.includes('fail') && !err.errMsg.includes('cancel'))) {
        wx.showModal({
          title: '导入失败',
          content: '导入过程中遇到问题，您可以重试或返回',
          confirmText: '重试',
          cancelText: '返回',
          success: (res) => {
            if (res.confirm) {
              // 用户点击重试，重新开始导入
              this.showImportOptions();
            } else {
              // 用户点击返回，导航回上一页
              wx.navigateBack();
            }
          }
        });
      }
    }, 2000);
  },

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  }
}); 