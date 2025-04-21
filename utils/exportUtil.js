// utils/exportUtil.js

// 引入自定义Markdown解析工具
const { markdownToHtml } = require('./markdown.js');

/**
 * 将Markdown内容导出为文件
 * @param {string} content - Markdown内容
 * @param {string} filename - 文件名
 */
function exportMarkdown(content, filename) {
  return new Promise((resolve, reject) => {
    try {
      // 确保文件名以.md结尾
      if (!filename.endsWith('.md')) {
        filename = filename + '.md';
      }
      
      const fs = wx.getFileSystemManager();
      const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;
      
      fs.writeFile({
        filePath: filePath,
        data: content,
        encoding: 'utf8',
        success: () => {
          console.log('Markdown文件已保存:', filePath);
          
          // 提示用户选择操作
          wx.showModal({
            title: '导出成功',
            content: `已导出 "${filename}"`,
            confirmText: '打开文件',
            cancelText: '保存本地',
            success: (res) => {
              if (res.confirm) {
                // 尝试打开文件
                wx.openDocument({
                  filePath: filePath,
                  fileType: 'md',
                  success: () => {
                    console.log('打开Markdown文件成功');
                    resolve(filePath);
                  },
                  fail: (openErr) => {
                    console.error('打开文件失败:', openErr);
                    // 如果打开失败，尝试保存到本地
                    saveToLocalStorage(filePath, filename)
                      .then(resolve)
                      .catch(reject);
                  }
                });
              } else if (res.cancel) {
                // 用户选择保存到本地
                saveToLocalStorage(filePath, filename)
                  .then(resolve)
                  .catch(reject);
              }
            }
          });
        },
        fail: (err) => {
          console.error('保存Markdown文件失败:', err);
          reject(err);
        }
      });
    } catch (error) {
      console.error('导出Markdown错误:', error);
      reject(error);
    }
  });
}

/**
 * 将Markdown内容导出为HTML文件
 * @param {string} mdContent - Markdown内容
 * @param {string} title - 文档标题
 * @param {string} filename - 文件名
 */
function exportHTML(mdContent, title, filename) {
  return new Promise((resolve, reject) => {
    try {
      // 确保文件名以.html结尾
      if (!filename.endsWith('.html')) {
        filename = filename + '.html';
      }
      
      // 转换Markdown为HTML
      const htmlContent = markdownToHtml(mdContent, title);
      const fs = wx.getFileSystemManager();
      const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;
      
      fs.writeFile({
        filePath: filePath,
        data: htmlContent,
        encoding: 'utf8',
        success: () => {
          console.log('HTML文件已保存:', filePath);
          
          // 提示用户选择操作
          wx.showModal({
            title: '导出成功',
            content: `已导出 "${filename}"`,
            confirmText: '打开文件',
            cancelText: '保存本地',
            success: (res) => {
              if (res.confirm) {
                // 尝试打开文件
                wx.openDocument({
                  filePath: filePath,
                  fileType: 'html',
                  success: () => {
                    console.log('打开HTML文件成功');
                    resolve(filePath);
                  },
                  fail: (openErr) => {
                    console.error('打开文件失败:', openErr);
                    // 如果打开失败，尝试保存到本地
                    saveToLocalStorage(filePath, filename)
                      .then(resolve)
                      .catch(reject);
                  }
                });
              } else if (res.cancel) {
                // 用户选择保存到本地
                saveToLocalStorage(filePath, filename)
                  .then(resolve)
                  .catch(reject);
              }
            }
          });
        },
        fail: (err) => {
          console.error('保存HTML文件失败:', err);
          reject(err);
        }
      });
    } catch (error) {
      console.error('导出HTML错误:', error);
      reject(error);
    }
  });
}

/**
 * 保存文件到本地存储
 * @param {string} filePath 文件路径
 * @param {string} fileName 文件名
 * @returns {Promise} 成功返回filePath，失败返回错误
 */
function saveToLocalStorage(filePath, fileName) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    
    // 检查文件是否存在
    fs.access({
      path: filePath,
      success: () => {
        // 检查 saveFileToDisk API 是否可用 (基础库 2.11.0 开始支持)
        if (typeof wx.saveFileToDisk === 'function') {
          wx.saveFileToDisk({
            filePath: filePath,
            success: () => {
              console.log('文件已保存到本地:', filePath);
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              });
              resolve(filePath);
            },
            fail: (err) => {
              console.log('保存到本地失败:', err);
              
              // 检查错误类型，判断是权限问题还是用户取消
              if (err.errMsg && (err.errMsg.indexOf('auth deny') >= 0 || err.errMsg.indexOf('authorize') >= 0)) {
                wx.showModal({
                  title: '保存失败',
                  content: '需要您授权保存文件到本地',
                  confirmText: '去授权',
                  success(res) {
                    if (res.confirm) {
                      wx.openSetting();
                    }
                  }
                });
                reject(new Error('保存权限被拒绝'));
              } else if (err.errMsg && err.errMsg.indexOf('cancel') >= 0) {
                // 用户取消了保存操作
                console.log('用户取消了保存操作');
                // 这种情况下不视为错误，返回原始文件路径
                resolve(filePath);
              } else {
                // 尝试分享文件作为备选方案
                tryShareFile(filePath, resolve, reject);
              }
            }
          });
        } else {
          // 如果API不可用，提示用户并尝试分享作为备选
          console.log('saveFileToDisk API不可用，可能是基础库版本过低');
          wx.showModal({
            title: '提示',
            content: '当前版本不支持保存到本地，请更新微信或使用分享功能',
            confirmText: '分享文件',
            cancelText: '取消',
            success(res) {
              if (res.confirm) {
                tryShareFile(filePath, resolve, reject);
              } else {
                reject(new Error('不支持的操作'));
              }
            }
          });
        }
      },
      fail: (err) => {
        console.error('文件不存在:', err);
        wx.showToast({
          title: '文件不存在',
          icon: 'error'
        });
        reject(new Error(`文件 ${fileName} 不存在`));
      }
    });
  });
}

/**
 * 尝试分享文件（作为保存失败的备选方案）
 */
function tryShareFile(filePath, resolve, reject) {
  wx.showLoading({ title: '准备分享文件...' });
  
  // 检查分享文件API是否可用
  if (typeof wx.shareFileMessage === 'function') {
    wx.shareFileMessage({
      filePath: filePath,
      success: () => {
        wx.hideLoading();
        console.log('文件分享成功');
        resolve(filePath);
      },
      fail: (shareErr) => {
        wx.hideLoading();
        console.error('文件分享失败:', shareErr);
        
        // 显示错误提示
        wx.showModal({
          title: '分享失败',
          content: '无法分享文件，请检查文件格式或稍后再试',
          showCancel: false
        });
        
        reject(shareErr);
      }
    });
  } else {
    wx.hideLoading();
    wx.showModal({
      title: '提示',
      content: '当前版本不支持文件分享功能，请更新微信后再试',
      showCancel: false
    });
    reject(new Error('分享文件API不可用'));
  }
}

/**
 * 简易PDF导出（基于canvas生成图片）
 * @param {string} markdown Markdown内容
 * @param {Page} pageInstance 调用页面的实例 (必须传入 `this`)
 * @param {string} renderContainerId 用于渲染的容器ID (WXML中隐藏的view)
 * @param {string} filename 文件名(默认:document.pdf)
 */
export function exportPDF(markdown, pageInstance, renderContainerId = 'pdf-render-container', filename = 'document.pdf') {
  return new Promise((resolve, reject) => {
    if (!pageInstance || typeof pageInstance.setData !== 'function') {
      return reject('无效的页面实例');
    }

    // 1. 先转换为HTML
    let html = '';
    try {
      html = markdownToHtml(markdown || '');
    } catch (e) {
      console.error('Markdown parsing error for PDF:', e);
      return reject('Markdown 解析失败');
    }

    // 2. 使用 pageInstance.setData 更新隐藏容器的内容并显示它
    const tempPdfData = {};
    tempPdfData[`${renderContainerId}_html`] = html; // 动态 key
    tempPdfData[`${renderContainerId}_show`] = true; // 动态 key
    
    // 显示加载信息
    wx.showLoading({
      title: '正在渲染文档...',
      mask: true
    });
    
    pageInstance.setData(tempPdfData, () => {
      // 给足够的时间让渲染完成并计算尺寸
      setTimeout(() => {
        try {
          // 3. 获取渲染后的节点信息
          const query = wx.createSelectorQuery().in(pageInstance);
          query.select(`#${renderContainerId}`)
            .fields({ node: true, size: true, rect: true }, res => {
              try {
                // 检查是否找到节点
                if (!res) {
                  // 完成后隐藏渲染容器
                  const hideData = {};
                  hideData[`${renderContainerId}_show`] = false;
                  pageInstance.setData(hideData);
                  wx.hideLoading();
                  return reject(`找不到渲染节点 #${renderContainerId}`);
                }
                
                console.log('找到PDF渲染节点:', res);
                
                // 创建Canvas
                const canvasQuery = wx.createSelectorQuery().in(pageInstance);
                canvasQuery.select('#pdf-canvas')
                  .fields({ node: true, size: true }, canvasRes => {
                    try {
                      // 找不到Canvas节点
                      if (!canvasRes || !canvasRes.node) {
                        wx.hideLoading();
                        const hideData = {};
                        hideData[`${renderContainerId}_show`] = false;
                        pageInstance.setData(hideData);
                        return reject('找不到Canvas节点');
                      }
                      
                      // 使用Canvas处理PDF导出
                      processPdfCanvas(canvasRes, pageInstance, filename, resolve, reject)
                        .finally(() => {
                          // 无论成功失败，都要隐藏容器
                          const hideData = {};
                          hideData[`${renderContainerId}_show`] = false;
                          pageInstance.setData(hideData);
                          wx.hideLoading();
                        });
                    } catch (canvasError) {
                      console.error('Canvas处理错误:', canvasError);
                      wx.hideLoading();
                      const hideData = {};
                      hideData[`${renderContainerId}_show`] = false;
                      pageInstance.setData(hideData);
                      reject('Canvas处理过程出错: ' + canvasError.message);
                    }
                  })
                  .exec();
              } catch (queryError) {
                console.error('查询处理错误:', queryError);
                wx.hideLoading();
                const hideData = {};
                hideData[`${renderContainerId}_show`] = false;
                pageInstance.setData(hideData);
                reject('查询节点过程出错: ' + queryError.message);
              }
            })
            .exec();
        } catch (error) {
          console.error('创建查询选择器错误:', error);
          wx.hideLoading();
          const hideData = {};
          hideData[`${renderContainerId}_show`] = false;
          pageInstance.setData(hideData);
          reject('创建查询选择器错误: ' + error.message);
        }
      }, 800); // 给予更多时间让DOM渲染完成
    });
  });
}

// 提取处理canvas的逻辑为单独函数
function processPdfCanvas(canvasRes, pageInstance, filename, resolve, reject) {
  return new Promise((processResolve, processReject) => {
    try {
      const canvas = canvasRes.node;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return processReject(new Error('无法获取Canvas上下文'));
      }
      
      // 设置Canvas尺寸 - 直接使用固定尺寸
      const width = 750; // 固定宽度
      const height = 1000; // 固定高度
      
      // 设置Canvas尺寸，高清显示
      const dpr = wx.getSystemInfoSync().pixelRatio || 2;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      
      // 绘制白色背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // 直接导出Canvas为图片，不再尝试获取内容节点
      wx.canvasToTempFilePath({
        canvas: canvas,
        x: 0,
        y: 0,
        width: width,
        height: height,
        destWidth: width * dpr,
        destHeight: height * dpr,
        fileType: 'png',
        quality: 1.0,
        success: (res) => {
          // 保存图片
          savePdfImage(res.tempFilePath, filename, resolve, processReject);
        },
        fail: (err) => {
          console.error('导出Canvas图片失败:', err);
          processReject(new Error('导出Canvas图片失败'));
        }
      });
    } catch (error) {
      console.error('处理Canvas过程出错:', error);
      processReject(error);
    }
  });
}

// 保存导出的PDF图片
function savePdfImage(tempFilePath, filename, resolve, reject) {
  try {
    // 获取文件系统管理器
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/${filename.replace(/\.pdf$/i, '.png')}`;
    
    // 保存图片
    fs.saveFile({
      tempFilePath: tempFilePath,
      filePath: filePath,
      success: () => {
        wx.showToast({
          title: '导出成功',
          icon: 'success',
          duration: 2000
        });
        
        // 提示用户选择操作
        wx.showModal({
          title: '导出成功',
          content: `文档已导出为图片格式`,
          confirmText: '保存到相册',
          cancelText: '关闭',
          success: (res) => {
            if (res.confirm) {
              // 保存到相册
              wx.saveImageToPhotosAlbum({
                filePath: filePath,
                success: () => {
                  wx.showToast({
                    title: '已保存到相册',
                    icon: 'success'
                  });
                  resolve(filePath);
                },
                fail: (err) => {
                  console.error('保存到相册失败:', err);
                  if (err.errMsg && (err.errMsg.indexOf('auth deny') >= 0 || err.errMsg.indexOf('authorize') >= 0)) {
                    wx.showModal({
                      title: '提示',
                      content: '需要您授权保存图片到相册',
                      confirmText: '去授权',
                      success(modalRes) {
                        if (modalRes.confirm) {
                          wx.openSetting();
                        }
                        resolve(filePath); // 仍然认为导出成功
                      }
                    });
                  } else {
                    wx.showToast({
                      title: '保存到相册失败',
                      icon: 'none'
                    });
                    resolve(filePath); // 仍然认为导出成功
                  }
                }
              });
            } else {
              resolve(filePath);
            }
          }
        });
      },
      fail: (err) => {
        console.error('保存文件失败:', err);
        reject(new Error('保存文件失败'));
      }
    });
  } catch (error) {
    console.error('保存PDF图片过程出错:', error);
    reject(error);
  }
}

/**
 * 将Markdown内容导出为Word文档（docx格式）
 * 由于微信小程序环境限制，实际上是导出一个HTML文件，加入适合Word导入的样式
 * @param {string} mdContent - Markdown内容
 * @param {string} title - 文档标题
 * @param {string} filename - 文件名
 */
function exportWord(mdContent, title, filename) {
  return new Promise((resolve, reject) => {
    try {
      // 确保文件名以.docx结尾
      if (!filename.endsWith('.docx')) {
        filename = filename + '.docx';
      }
      
      // 转换为特殊格式的HTML（适合Word打开）
      const wordHtml = markdownToWordHtml(mdContent, title);
      const fs = wx.getFileSystemManager();
      
      // 实际保存为.html格式，但使用.docx扩展名
      // 某些系统上双击.docx会自动用Word打开
      const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;
      
      fs.writeFile({
        filePath: filePath,
        data: wordHtml,
        encoding: 'utf8',
        success: () => {
          console.log('Word文件已保存:', filePath);
          wx.hideLoading();
          
          // 提示用户选择操作 - 与Markdown和HTML导出保持一致
          wx.showModal({
            title: '导出成功',
            content: `已导出 "${filename}"`,
            confirmText: '打开文件',
            cancelText: '保存本地',
            success: (res) => {
              if (res.confirm) {
                // 尝试打开文件
                wx.openDocument({
                  filePath: filePath,
                  fileType: 'docx', // 直接使用docx类型
                  success: () => {
                    console.log('打开Word文件成功');
                    resolve(filePath);
                  },
                  fail: (openErr) => {
                    console.error('打开文件失败:', openErr);
                    // 如果打开失败，尝试保存到本地
                    saveToLocalStorage(filePath, filename)
                      .then(resolve)
                      .catch(reject);
                  }
                });
              } else if (res.cancel) {
                // 用户选择保存到本地
                saveToLocalStorage(filePath, filename)
                  .then(resolve)
                  .catch(reject);
              }
            }
          });
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('保存Word文件失败:', err);
          reject(err);
        }
      });
    } catch (error) {
      wx.hideLoading();
      console.error('导出Word错误:', error);
      reject(error);
    }
  });
}

/**
 * 将Markdown转换为适合Word的HTML格式
 * @param {string} markdown - Markdown内容
 * @param {string} title - 文档标题
 */
function markdownToWordHtml(markdown, title) {
  // 先转换为普通HTML
  let html = markdownToHtml(markdown || '', title);
  
  // 添加Word特定的样式和元数据
  // 这些样式可以帮助Word更好地解析HTML并保持格式
  const wordStyles = `
    <style>
      /* 基本样式 */
      body { font-family: 'Calibri', sans-serif; font-size: 11pt; }
      h1 { font-size: 20pt; font-weight: bold; color: #2F5496; }
      h2 { font-size: 16pt; font-weight: bold; color: #2F5496; }
      h3 { font-size: 14pt; font-weight: bold; color: #1F3763; }
      h4 { font-size: 12pt; font-weight: bold; }
      h5 { font-size: 11pt; font-weight: bold; }
      h6 { font-size: 11pt; font-style: italic; }
      
      /* 代码块 */
      pre { 
        background-color: #F8F8F8; 
        border: 1px solid #CCCCCC; 
        border-radius: 3px;
        padding: 10px; 
        font-family: 'Courier New', monospace;
      }
      
      code { 
        font-family: 'Courier New', monospace; 
        background-color: #F8F8F8;
        padding: 2px 4px;
      }
      
      /* 表格 */
      table { border-collapse: collapse; width: 100%; margin: 10px 0; }
      th, td { 
        border: 1px solid #CCCCCC; 
        padding: 8px; 
        text-align: left;
      }
      th { background-color: #F2F2F2; }
      
      /* 引用 */
      blockquote {
        border-left: 4px solid #DDD;
        padding-left: 15px;
        color: #666;
        margin: 15px 0;
      }
      
      /* 列表 */
      ul, ol { margin: 10px 0; padding-left: 30px; }
      
      /* 图片 */
      img { max-width: 100%; height: auto; }
      
      /* 链接 */
      a { color: #0563C1; text-decoration: underline; }
      
      /* Word特定的分页行为 */
      .page-break { page-break-after: always; }
      h1, h2 { page-break-after: avoid; }
      
      /* 避免代码块的换行问题 */
      pre, code { white-space: pre-wrap; }
    </style>
    
    <!-- Word特定元数据，帮助Word识别文档类型 -->
    <meta name="ProgId" content="Word.Document">
    <meta name="Generator" content="Microsoft Word 15">
    <meta name="Originator" content="Microsoft Word 15">
  `;
  
  // 将样式插入到HTML头部
  html = html.replace('<head>', `<head>\n${wordStyles}`);
  
  return html;
}

// 导出功能函数
module.exports = {
  exportMarkdown,
  exportHTML,
  exportPDF,
  exportWord,
  saveToLocalStorage
};