// pages/profile/profile.js
const app = getApp(); // 引入 app

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 用户信息
    userInfo: {
      name: '未登录',
      email: '点击登录',
      avatar: '/image/default_avatar.svg'
    },
    // 设置项状态
    settings: {
      // theme: '浅色', // Removed, use themeMode and manualTheme for logic
      font: '系统默认',
      fontSize: '中',
      autoSave: false,
      livePreview: false,
      spellCheck: false,
      cloudSync: false,
      storage: {
        used: '1.2GB',
        total: '5GB'
      }
    },
    // 新的主题相关状态
    themeMode: 'system', // 'system' or 'manual'
    currentTheme: 'light', // 'light', 'dark', 'github' - 当前生效的主题
    manualThemeName: '浅色', // 手动模式下选择的主题名称
    // 是否显示登录按钮
    showLoginBtn: false,
    // 字体和字号样式类 (保留，因为字体/字号切换逻辑不变)
    fontClass: '',
    // 主题选项 (保持不变)
    themeOptions: [
      {name: '浅色', value: 'light'},
      {name: '深色', value: 'dark'},
      {name: 'GitHub', value: 'github'}
    ],
    // 跟随系统选项
    systemThemeOption: { name: '跟随系统', value: 'system' },
    // 字体选项 (保持不变)
    fontOptions: [
      {name: '系统默认', value: 'system'},
      {name: '衬线字体', value: 'serif'},
      {name: '无衬线字体', value: 'sans-serif'},
      {name: '楷书', value: 'kai'}
    ],
    // 字号选项 (保持不变)
    fontSizeOptions: [
      {name: '小', value: 'small'},
      {name: '中', value: 'medium'},
      {name: '大', value: 'large'}
    ],
    // 版本信息
    version: 'v1.0.7',
    // 是否显示选择器
    showThemeSelector: false,
    showFontSelector: false,
    showFontSizeSelector: false,
    // 是否已登录
    isLoggedIn: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取全局设置 (字体、字号、开关等)
    this.loadAndApplyOtherSettings();
    
    // 初始化主题状态
    this.updateThemeDisplay();

    // 加载登录状态和用户信息 (保留)
    this.loadLoginStatus();
  },

  onShow() {
    // 每次显示时都更新主题显示状态，以防在其他地方修改
    this.updateThemeDisplay();
    // 其他需要刷新的数据...
  },

  // --- 主题相关方法 (Refactored) ---
  // 更新页面显示的主题状态
  updateThemeDisplay() {
    const themeMode = app.globalData.themeMode;
    const manualThemeValue = app.globalData.manualTheme;
    const currentTheme = app.getCurrentTheme(); // 获取当前生效的主题
    const manualTheme = this.data.themeOptions.find(t => t.value === manualThemeValue);

    this.setData({
      themeMode: themeMode,
      currentTheme: currentTheme, // 用于 WXML 绑定 theme-{{currentTheme}}
      manualThemeName: manualTheme ? manualTheme.name : '浅色'
    });
  },

  // 监听来自 app.js 的主题变化通知 (New)
  onThemeChange(theme) {
    console.log('Profile page received theme change:', theme);
    this.setData({ currentTheme: theme });
  },

  // 点击"主题"设置项，显示选择器
  switchTheme: function() {
    this.setData({ showThemeSelector: true });
  },
  // 关闭主题选择器
  closeThemeSelector: function() {
    this.setData({ showThemeSelector: false });
  },
  // 选择主题或模式
  selectThemeOrMode: function(e) {
    const value = e.currentTarget.dataset.value;
    
    if (value === 'system') {
      // 选择"跟随系统"
      app.setThemeMode('system');
    } else {
      // 选择了一个具体的主题 (浅色/深色/GitHub)
      // 1. 设置手动主题值
      app.setManualTheme(value);
      // 2. 如果当前不是手动模式，切换到手动模式
      if (app.globalData.themeMode !== 'manual') {
        app.setThemeMode('manual');
      }
    }
    // 更新当前页面的显示状态
    this.updateThemeDisplay();
    this.closeThemeSelector(); // 关闭选择器
  },
  
  // --- 其他设置加载与应用 (Refactored) ---
  loadAndApplyOtherSettings() {
    // 加载字体、字号、开关等设置
    this.setData({
      'settings.font': this.getFontNameByValue(app.globalData.font),
      'settings.fontSize': this.getFontSizeNameByValue(app.globalData.fontSize),
      'settings.autoSave': app.globalData.autoSave,
      'settings.livePreview': app.globalData.livePreview,
      'settings.spellCheck': app.globalData.spellCheck,
      'settings.cloudSync': app.globalData.cloudSync,
      'settings.storage': app.globalData.storage || { used: 'N/A', total: 'N/A' } // 添加默认值
    });
    // 应用字体和字号样式
    this.applyFontAndSizeClass();
  },

  applyFontAndSizeClass() {
    const fontClass = `font-${app.globalData.font || 'system'} font-size-${app.globalData.fontSize || 'medium'}`;
    this.setData({ fontClass: fontClass });
  },

  // --- 字体/字号切换 (基本不变, 调用 saveOtherSettings) ---
  switchFont: function() {
    this.setData({ showFontSelector: true });
  },
  closeFontSelector: function() {
    this.setData({ showFontSelector: false });
  },
  selectFont: function(e) {
    const selectedIndex = e.currentTarget.dataset.index;
    const selectedFont = this.data.fontOptions[selectedIndex];

    this.setData({
      'settings.font': selectedFont.name,
      showFontSelector: false
    });
    
    app.globalData.font = selectedFont.value;
    app.saveOtherSettings(); // 保存其他设置
    this.applyFontAndSizeClass(); // 更新当前页字体样式类
    // 注意：字体变化也应通知其他页面，但此方案暂未实现
  },
  switchFontSize: function() {
    this.setData({ showFontSizeSelector: true });
  },
  closeFontSizeSelector: function() {
    this.setData({ showFontSizeSelector: false });
  },
  selectFontSize: function(e) {
    const selectedIndex = e.currentTarget.dataset.index;
    const selectedSize = this.data.fontSizeOptions[selectedIndex];

    this.setData({
      'settings.fontSize': selectedSize.name,
      showFontSizeSelector: false
    });
    
    app.globalData.fontSize = selectedSize.value;
    app.saveOtherSettings(); // 保存其他设置
    this.applyFontAndSizeClass(); // 更新当前页字号样式类
     // 注意：字号变化也应通知其他页面，但此方案暂未实现
  },
  
  // --- 开关项切换 (调用 saveOtherSettings) ---
  toggleAutoSave: function(e) {
    const value = e.detail.value;
    this.setData({ 'settings.autoSave': value });
    app.globalData.autoSave = value;
    app.saveOtherSettings();
  },
  toggleLivePreview: function(e) {
    const value = e.detail.value;
    this.setData({ 'settings.livePreview': value });
    app.globalData.livePreview = value;
    app.saveOtherSettings();
  },
  toggleSpellCheck: function(e) {
    const value = e.detail.value;
    this.setData({ 'settings.spellCheck': value });
    app.globalData.spellCheck = value;
    app.saveOtherSettings();
  },

  // --- 其他设置项 (保持不变) ---
  toggleCloudSync: function(e) {
    wx.showToast({ title: '云同步功能尚未开放', icon: 'none' });
    this.setData({ 'settings.cloudSync': false }); // Reset switch
  },
  viewStorage: function() {
    const storageInfo = app.globalData.storage || { used: 'N/A', total: 'N/A' };
    wx.showModal({
        title: '存储空间',
        content: `已使用: ${storageInfo.used}\n总空间: ${storageInfo.total}\n(此为模拟数据，云存储功能开发中)`,
        showCancel: false,
        confirmText: '知道了'
    });
  },
  viewHelp: function() {
    wx.navigateTo({ url: '/pages/help/help' });
  },
  viewAbout: function() {
    wx.showModal({
      title: '关于 轻码笔记',
      content: `版本: ${this.data.version}\n作者: 旧梦\n邮箱: 2070360680@qq.com`, 
      showCancel: false,
      confirmText: '确定'
    });
  },
  
  // --- 登录相关 (保留大部分，仅调整加载时机) ---
  loadLoginStatus() {
    const token = wx.getStorageSync('markmark_token');
    const storedUserInfo = wx.getStorageSync('markmark_userInfo');
    
    if (token && storedUserInfo && !app.globalData.userInfo) {
      app.globalData.userInfo = storedUserInfo;
      app.globalData.token = token;
      this.checkLoginStatus(storedUserInfo);
    }
    
    this.setData({
      isLoggedIn: !!app.globalData.userInfo
    });
        
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
    } else {
      this.setData({
        'userInfo.name': '未登录',
        'userInfo.email': '点击登录',
        'userInfo.avatar': '/image/default_avatar.svg'
      });
    }
  },
  
  /**
   * 检查登录状态
   */
  checkLoginStatus(userInfo) {
    // 首先检查本地是否有token
    const token = wx.getStorageSync('markmark_token');
    if (!token) {
      console.log('未找到登录凭证，需要重新登录');
      this.clearLoginStatus();
      return;
    }
    
    // 检查登录时间是否超过7天（微信登录态有效期通常为7天）
    const now = new Date().getTime();
    const loginTime = userInfo.loginTime || 0;
    const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7天的毫秒数
    
    if (now - loginTime > sevenDays) {
      // 登录时间超过7天，检查会话是否过期
      wx.checkSession({
        success: () => {
          // 会话未过期，不需要重新登录
          console.log('登录会话有效');
          // 实际项目中，这里应该验证token的有效性
          this.verifyToken(token);
        },
        fail: () => {
          // 会话已过期，需要重新登录
          console.log('登录会话已过期，需要重新登录');
          // 清除登录状态，但不主动弹出登录框
          this.clearLoginStatus();
        }
      });
    } else {
      // 登录时间未超过7天，检查会话是否过期
      wx.checkSession({
        success: () => {
          // 会话未过期，验证token有效性
          this.verifyToken(token);
        },
        fail: () => {
          // 会话已过期，需要重新登录
          console.log('登录会话已过期，需要重新登录');
          this.clearLoginStatus();
        }
      });
    }
  },
  
  /**
   * 验证token有效性
   * 实际项目中应该发送请求到服务器验证
   */
  verifyToken(token) {
    // 模拟验证token的过程
    // 实际项目中，应该发送请求到服务器验证token是否有效
    console.log('验证token有效性:', token);
    
    // 这里简单模拟token有效的情况
    // 如果token无效，应该调用clearLoginStatus()
    if (app.globalData.userInfo) {
      console.log('token有效，用户已登录');
    } else {
      console.log('token无效，需要重新登录');
      this.clearLoginStatus();
    }
  },
  
  /**
   * 清除登录状态
   */
  clearLoginStatus() {
    app.globalData.userInfo = null;
    app.globalData.token = null; // 清除全局token
    
    // 更新页面数据
    this.setData({
      'userInfo.name': '未登录',
      'userInfo.email': '点击登录',
      'userInfo.avatar': '/image/default_avatar.svg',
      isLoggedIn: false
    });
    
    // 清除本地存储的用户信息和token
    wx.removeStorageSync('markmark_userInfo');
    wx.removeStorageSync('markmark_token');
    
    // 提示用户重新登录
    wx.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none',
      duration: 2000
    });
  },
  
  // 根据字体值获取显示名称
  getFontNameByValue(value) {
    const font = this.data.fontOptions.find(item => item.value === value);
    return font ? font.name : '系统默认';
  },
  
  // 根据字号值获取显示名称
  getFontSizeNameByValue(value) {
    const fontSize = this.data.fontSizeOptions.find(item => item.value === value);
    return fontSize ? fontSize.name : '中';
  },

  /**
   * 用户信息点击处理
   */
  handleUserInfoTap() {
    if (this.data.isLoggedIn) {
      // 已登录状态，显示用户信息和操作选项
      wx.showActionSheet({
        itemList: ['查看个人信息', '修改昵称', '修改头像', '刷新登录状态', '退出登录'],
        success: (res) => {
          switch(res.tapIndex) {
            case 0: // 查看个人信息
              this.showUserDetail();
              break;
            case 1: // 修改昵称
              this.modifyNickname();
              break;
            case 2: // 修改头像
              this.modifyAvatar();
              break;
            case 3: // 刷新登录状态
              this.refreshLoginStatus();
              break;
            case 4: // 退出登录
              this.logout();
              break;
          }
        }
      });
    } else {
      // 未登录状态，直接触发隐藏按钮（兼容性方案）
      this.setData({ showLoginBtn: true }, () => {
        setTimeout(() => {
          const query = wx.createSelectorQuery();
          query.select('.hidden-login-btn').boundingClientRect();
          query.exec((res) => {
            if (res[0]) {
              // 模拟点击事件
              const event = {
                detail: {
                  userInfo: {
                    nickName: '',
                    avatarUrl: ''
                  }
                }
              };
              this.handleGetUserProfile(event);
            }
          });
        }, 100);
      });
    }
  },

  /**
   * 阻止默认事件
   */
  preventDefault() {},

  /**
   * 处理用户信息获取
   */
  onGetUserProfile(e) {
    if (e.detail.userInfo) {
      // 用户同意授权
      this.wxLogin(e.detail.userInfo);
    } else {
      // 用户拒绝授权
      wx.showToast({
        title: '您拒绝了授权',
        icon: 'none'
      });
    }
  },
  
  /**
   * 处理用户信息获取（核心方法）
   */
  handleGetUserProfile(e) {
    if (e.detail.userInfo) {
      this.wxLogin(e.detail.userInfo); // 获取到用户信息后执行登录
    } else {
      wx.showToast({ title: '授权已取消', icon: 'none' });
    }
  },
  
  /**
   * 微信登录流程
   */
  wxLogin(userInfo) {
    wx.showLoading({ title: '登录中...', mask: true });
    
    // 1. 获取code
    wx.login({
      success: (res) => {
        if (res.code) {
          // 2. 构建完整用户数据
          const userData = {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            gender: userInfo.gender,
            country: userInfo.country,
            province: userInfo.province,
            city: userInfo.city,
            code: res.code,
            loginTime: Date.now()
          };
          
          // 3. 发送到开发者服务器
          this.sendToServer(userData);
        } else {
          wx.hideLoading();
          wx.showToast({ title: '获取登录码失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      }
    });
  },
  
  /**
   * 显示用户详细信息
   */
  showUserDetail() {
    const userInfo = this.data.userInfo;
    wx.showModal({
      title: '个人信息',
      content: `昵称: ${userInfo.name}\n地区: ${userInfo.province || ''} ${userInfo.city || ''}\n登录时间: ${new Date(userInfo.loginTime).toLocaleString()}`,
      showCancel: false,
      confirmText: '确定'
    });
  },
  
  /**
   * 修改昵称
   */
  modifyNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          const newNickname = res.content.trim();
          if (newNickname) {
            const newUserInfo = { ...this.data.userInfo, name: newNickname };
            this.setData({ userInfo: newUserInfo }); // 更新页面
            if (app.globalData.userInfo) app.globalData.userInfo.name = newNickname; // 更新全局
            wx.setStorageSync('markmark_userInfo', app.globalData.userInfo); // 更新存储
            wx.showToast({ title: '昵称修改成功', icon: 'success' });
          }
        }
      }
    });
  },
  
  /**
   * 修改头像
   */
  modifyAvatar() {
          wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album'],
            success: (res) => {
              const tempFilePath = res.tempFilePaths[0];
        const newUserInfo = { ...this.data.userInfo, avatar: tempFilePath };
        this.setData({ userInfo: newUserInfo }); // 更新页面
        if (app.globalData.userInfo) app.globalData.userInfo.avatar = tempFilePath; // 更新全局
        wx.setStorageSync('markmark_userInfo', app.globalData.userInfo); // 更新存储
        wx.showToast({ title: '头像修改成功', icon: 'success' });
      }
    });
  },
  
  /**
   * 刷新登录状态
   */
  refreshLoginStatus() {
    wx.showLoading({
      title: '刷新中...',
      mask: true
    });
    
    // 检查会话是否过期
    wx.checkSession({
      success: () => {
        // 会话未过期，验证token
        const token = wx.getStorageSync('markmark_token');
        if (token) {
          this.verifyToken(token);
          wx.hideLoading();
          wx.showToast({
            title: '登录状态有效',
            icon: 'success'
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '登录凭证已失效，请重新登录',
            icon: 'none'
          });
          this.clearLoginStatus();
        }
      },
      fail: () => {
        // 会话已过期，需要重新登录
        wx.hideLoading();
        wx.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none'
        });
        this.clearLoginStatus();
      }
    });
  },
  
  /**
   * 退出登录
   */
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用清除登录状态的函数
          this.clearLoginStatus();
          // 显示退出成功提示
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },
  
  /**
   * 登录处理
   * 注意：由于微信安全限制，getUserProfile必须在用户点击事件中直接调用
   */
  login() {
    // 检查本地是否有token
    const token = wx.getStorageSync('markmark_token');
    
    // 检查登录状态是否过期
    wx.checkSession({
      success: () => {
        // 登录态未过期
        if (token && !this.data.isLoggedIn) {
          // 有token但未登录状态，验证token有效性
          this.verifyToken(token);
        } else if (!this.data.isLoggedIn) {
          // 无token且未登录，提示用户点击头像登录
          // 由于getUserProfile必须在用户点击事件中直接调用
          // 所以这里只提示用户点击头像登录
          wx.showToast({
            title: '请点击头像登录',
            icon: 'none'
          });
        }
      },
      fail: () => {
        // 登录态已过期，需要重新登录
        console.log('登录态已过期，需要重新获取用户信息');
        // 清除旧的token
        if (token) {
          wx.removeStorageSync('markmark_token');
        }
        // 提示用户点击头像登录
        wx.showToast({
          title: '登录已过期，请点击头像重新登录',
          icon: 'none'
        });
      }
    });
  },
  // 冗余方法已删除，使用wxLogin和handleGetUserProfile替代

  /**
   * 发送数据到服务器
   */
  sendToServer(userData) {
    // 模拟网络请求
    setTimeout(() => {
      try {
        // 模拟服务器返回
        const mockResponse = {
          success: true,
          token: 'mock_token_' + Date.now(),
          userInfo: {
            name: userData.nickName || '用户' + Math.floor(Math.random() * 10000),
            avatar: userData.avatarUrl || '/image/default_avatar.svg',
            email: '',
            gender: userData.gender,
            country: userData.country,
            province: userData.province,
            city: userData.city,
            loginTime: userData.loginTime
          }
        };
        
        if (mockResponse.success) {
          // 保存登录状态
          const app = getApp();
          app.globalData.userInfo = mockResponse.userInfo;
          app.globalData.token = mockResponse.token;
          
          wx.setStorageSync('markmark_userInfo', mockResponse.userInfo);
          wx.setStorageSync('markmark_token', mockResponse.token);
          
          // 更新UI
          this.setData({
            userInfo: mockResponse.userInfo,
            isLoggedIn: true,
            showLoginBtn: false
          });
          
          wx.hideLoading();
          wx.showToast({ title: '登录成功', icon: 'success' });
        }
      } catch (error) {
        wx.hideLoading();
        wx.showToast({ title: '登录处理失败', icon: 'none' });
      }
    }, 1000);
    
    // 真实项目中的请求示例（替换上面的模拟代码）
    /*
    wx.request({
      url: 'https://your-api.com/login',
      method: 'POST',
      data: {
        code: userData.code,
        nickName: userData.nickName,
        avatarUrl: userData.avatarUrl
        // 其他必要字段...
      },
      success: (res) => {
        if (res.data.success) {
          // 保存登录状态
          const app = getApp();
          app.globalData.userInfo = res.data.userInfo;
          app.globalData.token = res.data.token;
          
          wx.setStorageSync('markmark_userInfo', res.data.userInfo);
          wx.setStorageSync('markmark_token', res.data.token);
          
          // 更新UI
          this.setData({
            userInfo: res.data.userInfo,
            isLoggedIn: true,
            showLoginBtn: false
          });
          
          wx.hideLoading();
          wx.showToast({ title: '登录成功', icon: 'success' });
        } else {
          wx.hideLoading();
          wx.showToast({ title: res.data.message || '登录失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('登录请求失败', err);
        wx.hideLoading();
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
    */
  },

  /**
   * 后端安全增强建议（实际项目参考）
   * 
   * Node.js后端示例：
   * 
   * // 1. 安装依赖
   * // npm install axios jsonwebtoken
   * 
   * // 2. 实现登录接口
   * const axios = require('axios');
   * const jwt = require('jsonwebtoken');
   * 
   * app.post('/login', async (req, res) => {
   *   const { code } = req.body;
   *   
   *   try {
   *     // 用code换取openid和session_key
   *     const result = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
   *       params: {
   *         appid: '你的APPID',
   *         secret: '你的APPSECRET',
   *         js_code: code,
   *         grant_type: 'authorization_code'
   *       }
   *     });
   *     
   *     if (result.data.errcode) {
   *       return res.json({ success: false, message: '微信登录失败' });
   *     }
   *     
   *     // 生成token（使用JWT）
   *     const token = jwt.sign(
   *       { openid: result.data.openid }, 
   *       '你的密钥', 
   *       { expiresIn: '7d' }
   *     );
   *     
   *     // 返回登录结果
   *     res.json({ 
   *       success: true, 
   *       token, 
   *       userInfo: req.body 
   *     });
   *   } catch (error) {
   *     console.error('登录处理失败', error);
   *     res.json({ success: false, message: '服务器处理失败' });
   *   }
   * });
   */
  
  /**
   * 刷新token
   * @param {string} refresh_token 刷新token的凭证
   */
  refreshToken(refresh_token) {
    console.log('开始刷新token');
    // 模拟刷新token的过程
    setTimeout(() => {
      try {
        const mockRefreshResponse = {
          token: 'refreshed_token_' + Date.now(),
          expires_in: 7200,
          refresh_token: 'refresh_' + Date.now()
        };
        
        // 更新存储
        const app = getApp();
        app.globalData.token = mockRefreshResponse.token;
        wx.setStorageSync('markmark_token', mockRefreshResponse.token);
        wx.setStorageSync('markmark_refresh_token', mockRefreshResponse.refresh_token);
        
        // 设置新的过期检查
        const timeoutDuration = (mockRefreshResponse.expires_in * 1000) - 60000;
        if(timeoutDuration > 0) {
          setTimeout(() => {
            this.refreshToken(mockRefreshResponse.refresh_token);
          }, timeoutDuration);
        }
        
        console.log('token刷新成功');
      } catch(err) {
        console.error('刷新token失败:', err);
        // token刷新失败时的处理
        this.clearLoginStatus();
      }
    }, 1000);
  },

  // --- 外观设置处理 ---
  // 显示主题选择器
  switchTheme: function() {
    this.setData({ showThemeSelector: true });
  },
  // 关闭主题选择器
  closeThemeSelector: function() {
    this.setData({ showThemeSelector: false });
  },
  // 选择主题
  selectTheme: function(e) {
    const app = getApp();
    const selectedIndex = e.currentTarget.dataset.index;
    const selectedTheme = this.data.themeOptions[selectedIndex];

    this.setData({
      'settings.theme': selectedTheme.name,
      showThemeSelector: false
    });
    
    app.globalData.theme = selectedTheme.value;
    app.saveSettings();
    this.updatePageStyle();
    app.updateTheme(); // 更新 TabBar 等全局元素
  },

  // 显示字体选择器
  switchFont: function() {
    this.setData({ showFontSelector: true });
  },
  // 关闭字体选择器
  closeFontSelector: function() {
    this.setData({ showFontSelector: false });
  },
  // 选择字体
  selectFont: function(e) {
    const app = getApp();
    const selectedIndex = e.currentTarget.dataset.index;
    const selectedFont = this.data.fontOptions[selectedIndex];

    this.setData({
      'settings.font': selectedFont.name,
      showFontSelector: false
    });
    
    app.globalData.font = selectedFont.value;
    app.saveSettings();
    this.updatePageStyle();
  },

  // 显示字号选择器
  switchFontSize: function() {
    this.setData({ showFontSizeSelector: true });
  },
  // 关闭字号选择器
  closeFontSizeSelector: function() {
    this.setData({ showFontSizeSelector: false });
  },
  // 选择字号
  selectFontSize: function(e) {
    const app = getApp();
    const selectedIndex = e.currentTarget.dataset.index;
    const selectedSize = this.data.fontSizeOptions[selectedIndex];

    this.setData({
      'settings.fontSize': selectedSize.name,
      showFontSizeSelector: false
    });
    
    app.globalData.fontSize = selectedSize.value;
    app.saveSettings();
    this.updatePageStyle();
  },

  // 更新当前页面样式
  updatePageStyle: function() {
    const app = getApp();
    const globalSettings = app.globalData;
    const fontClass = `theme-${globalSettings.theme || 'light'} font-${globalSettings.font || 'system'} font-size-${globalSettings.fontSize || 'medium'}`;
    this.setData({ fontClass: fontClass });
    console.log('更新页面样式类:', fontClass);
    // 强制重绘页面以应用新样式 (可选，有时需要)
    // this.setData({ 'userInfo.name': this.data.userInfo.name + ' ' }); // 强制更新
    // setTimeout(() => this.setData({ 'userInfo.name': this.data.userInfo.name.trim() }), 0);
  },

  // 阻止事件冒泡
  stopPropagation: function() {},
  
  // --- 编辑器设置处理 ---
  toggleAutoSave: function(e) {
    const app = getApp();
    const value = e.detail.value;
    this.setData({ 'settings.autoSave': value });
    app.globalData.autoSave = value;
    app.saveSettings();
  },
  
  toggleLivePreview: function(e) {
    const app = getApp();
    const value = e.detail.value;
    this.setData({ 'settings.livePreview': value });
    app.globalData.livePreview = value;
    app.saveSettings();
  },
  
  toggleSpellCheck: function(e) {
    const app = getApp();
    const value = e.detail.value;
    this.setData({ 'settings.spellCheck': value });
    app.globalData.spellCheck = value;
    app.saveOtherSettings();
  },
  
  // --- 存储与同步处理 ---
  toggleCloudSync: function(e) {
    const value = e.detail.value;
    // 阻止切换并提示功能未开放
    wx.showToast({ title: '云同步功能尚未开放', icon: 'none' });
    // 重置开关状态
    this.setData({ 'settings.cloudSync': !value });
  },
  
  viewStorage: function() {
    // 实际应显示详细的存储使用情况，这里仅作示例
    wx.showModal({
        title: '存储空间',
        content: `已使用: ${this.data.settings.storage.used}\n总空间: ${this.data.settings.storage.total}\n(此为模拟数据，云存储功能开发中)`,
        showCancel: false,
        confirmText: '知道了'
    });
  },
  
  // --- 关于与帮助处理 ---
  viewHelp: function() {
    // 跳转到帮助中心页面
    wx.navigateTo({ url: '/pages/help/help' });
  },
  
  viewAbout: function() {
    wx.showModal({
      title: '关于 轻码笔记',
      content: `版本: ${this.data.version}\n作者: 旧梦\n邮箱: 2070360680@qq.com`, // 更新作者和邮箱
      showCancel: false,
      confirmText: '确定'
    });
  }
});
