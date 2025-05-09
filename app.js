// app.js
App({
  globalData: {
    userInfo: null,
    // --- Theme Settings --- (Refactored)
    themeMode: 'system', // 'system' or 'manual'
    manualTheme: 'light', // 'light', 'dark', 'github' - Used when themeMode is 'manual'
    // --- Other Settings --- (Keep existing)
    font: 'system', // system, serif, sans-serif, kai, monospace, rounded
    fontSize: 'medium', // xs, small, medium, large, xl
    autoSave: true,
    livePreview: true,
    spellCheck: false,
    cloudSync: false,
    storage: {
      used: '1.2GB', // 模拟数据
      total: '5GB' // 模拟数据
    },
    tags: [] // 存储标签数据
    // styleChanged flag is removed, replaced by notification
  },
  
  onLaunch: function() {
    // 初始化主题设置
    this.initTheme();
    // 加载其他设置 (字体、字号、开关等)
    this.loadOtherSettings();
    // 加载用户信息
    this.loadUserInfo();
    // 加载标签数据
    this.loadTags();
    
    // 创建示例文档和示例标签
    const documentUtils = require('./utils/document');
    documentUtils.createSampleDocuments();
    documentUtils.createSampleTag();
  },
  
  // 初始化主题 (Refactored)
  initTheme() {
    try {
      const saved = wx.getStorageSync('themeSettings');
      if (saved) {
        this.globalData.themeMode = saved.themeMode || 'system';
        this.globalData.manualTheme = saved.manualTheme || 'light';
      }
    } catch (e) {
      console.error('读取主题设置失败', e);
    }
    
    // 监听系统主题变化
    wx.onThemeChange((res) => {
      console.log('System theme changed:', res.theme);
      if (this.globalData.themeMode === 'system') {
        this.notifyAllPages(res.theme);
      }
    });
  },
  
  // 获取当前有效主题 (Refactored)
  getCurrentTheme() {
    if (this.globalData.themeMode === 'manual') {
      return this.globalData.manualTheme;
    }
    // 如果是 system 模式，获取系统当前主题
    try {
      // 使用新的API替换已废弃的wx.getSystemInfoSync()
      const appBaseInfo = wx.getAppBaseInfo();
      return appBaseInfo.theme || 'light';
    } catch (e) {
      console.error('获取系统主题失败', e);
      return 'light'; // Fallback to light
    }
  },
  
  // 切换主题模式 (Refactored)
  setThemeMode(mode) {
    if (this.globalData.themeMode !== mode) {
      this.globalData.themeMode = mode;
      this.saveThemeSettings(); // 保存主题设置
      const currentTheme = this.getCurrentTheme();
      this.updateTabBarTheme(currentTheme); // 更新 TabBar
      this.notifyAllPages(currentTheme); // 通知页面
    }
  },
  
  // 设置手动主题 (Refactored)
  setManualTheme(theme) {
    if (this.globalData.manualTheme !== theme) {
      this.globalData.manualTheme = theme;
      this.saveThemeSettings(); // 保存主题设置
      // 只有在手动模式下，设置手动主题才需要立即通知
      if (this.globalData.themeMode === 'manual') {
        this.updateTabBarTheme(theme);
        this.notifyAllPages(theme);
      }
    }
  },
  
  // 保存主题设置到本地 (Refactored)
  saveThemeSettings() {
    try {
      wx.setStorageSync('themeSettings', {
        themeMode: this.globalData.themeMode,
        manualTheme: this.globalData.manualTheme
      });
    } catch (e) {
      console.error('保存主题设置失败', e);
    }
  },
  
  // 通知所有页面主题变化 (Refactored)
  notifyAllPages(theme) {
    const pages = getCurrentPages();
    pages.forEach(page => {
      // 确保页面实例存在并且有 onThemeChange 方法
      if (page && typeof page.onThemeChange === 'function') {
        page.onThemeChange(theme);
      }
      // 尝试通知页面内的组件 (如果组件有 onThemeChange)
      // 注意: 这需要组件自行实现监听或页面传递
      // if (page.selectAllComponents) {
      //   page.selectAllComponents('.theme-aware-component').forEach(component => {
      //     if (component && typeof component.onThemeChange === 'function') {
      //       component.onThemeChange(theme);
      //     }
      //   });
      // }
    });
  },
  
  // 更新 TabBar 主题 (Refactored from updateTheme)
  updateTabBarTheme(theme) {
    let tabBarStyle = {
      color: '#8F8F8F',
      selectedColor: '#3E7FFF',
      backgroundColor: '#FFFFFF',
      borderStyle: 'white'
    };
    if (theme === 'dark') {
      tabBarStyle = {
        color: '#AAAAAA',
        selectedColor: '#FFFFFF',
        backgroundColor: '#1E1E1E',
        borderStyle: 'black'
      };
    } else if (theme === 'github') {
      tabBarStyle = {
        color: '#8b949e',
        selectedColor: '#c9d1d9',
        backgroundColor: '#161b22',
        borderStyle: 'black'
      };
    }
    // 确保在首次加载或 TabBar 不存在时不报错
    try {
      wx.setTabBarStyle(tabBarStyle);
    } catch(e) {
      console.warn('Set TabBarStyle failed, possibly on launch or page without TabBar.', e)
    }
  },
  
  // 加载其他设置 (字体、字号、开关等)
  loadOtherSettings: function() {
    const settings = wx.getStorageSync('markmark_settings');
    if (settings) {
      // 合并除了主题之外的其他设置
      const { theme, ...otherSettings } = settings; // 排除旧的 theme 字段
      Object.assign(this.globalData, otherSettings);
    }
  },
  
  // 保存其他设置 (字体、字号、开关等)
  saveOtherSettings: function() {
    wx.setStorageSync('markmark_settings', {
      // theme: this.globalData.theme, // 不再保存旧的 theme
      font: this.globalData.font,
      fontSize: this.globalData.fontSize,
      autoSave: this.globalData.autoSave,
      livePreview: this.globalData.livePreview,
      spellCheck: this.globalData.spellCheck,
      cloudSync: this.globalData.cloudSync
    });
  },
  
  // 通知所有页面样式已更改
  notifyAllPagesStyleChanged: function() {
    console.log('通知所有页面样式已更改');
    // 获取所有页面
    const pages = getCurrentPages();
    
    // 先强制更新当前页面（立即可见效果）
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.applyGlobalFontStyle) {
        console.log('立即更新当前页面:', currentPage.route);
        currentPage.applyGlobalFontStyle();
      }
    }
    
    // 逐个通知其他页面
    pages.forEach(page => {
      if (page && page.onStyleChange) {
        console.log('通知页面:', page.route);
        page.onStyleChange();
      }
    });
    
    // 触发一次全局主题更新以确保所有组件都更新
    const currentTheme = this.getCurrentTheme();
    this.notifyAllPages(currentTheme);
  },
  
  // 获取全局样式类
  getGlobalStyleClass: function() {
    const currentTheme = this.getCurrentTheme();
    const fontClass = `font-${this.globalData.font || 'system'}`;
    const fontSizeClass = `font-size-${this.globalData.fontSize || 'medium'}`;
    return `theme-${currentTheme} ${fontClass} ${fontSizeClass}`;
  },
  
  // 加载用户信息
  loadUserInfo: function() {
    const userInfo = wx.getStorageSync('markmark_userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },
  
  // 加载标签数据
  loadTags: function() {
    const documentUtils = require('./utils/document');
    this.globalData.tags = documentUtils.getAllTags();
  },
  
  // 保存标签数据
  saveTags: function() {
    // 标签数据已在各个操作函数中直接保存到本地存储
    // 此方法仅用于兼容现有代码，实际不再需要
    // 如果需要保存，使用documentUtils.saveTag方法
  },
})
