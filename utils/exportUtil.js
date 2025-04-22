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

    // 提取文档标题
    const docTitle = extractTitle(markdown) || filename.replace(/\.pdf$/i, '');
    
    // 显示加载信息
    wx.showLoading({
      title: '正在渲染文档...',
      mask: true
    });
    
    // 2. 使用 pageInstance.setData 更新隐藏容器的内容和状态
    const tempPdfData = {};
    tempPdfData[`${renderContainerId}_show`] = true; // 动态 key
    
    pageInstance.setData(tempPdfData, () => {
      setTimeout(() => {
        try {
          // 3. 获取Canvas节点
          const canvasQuery = wx.createSelectorQuery().in(pageInstance);
          canvasQuery.select('#pdf-canvas')
            .fields({ node: true, size: true, context: true }, canvasRes => {
              try {
                // 找不到Canvas节点
                if (!canvasRes || !canvasRes.node) {
                  wx.hideLoading();
                  const hideData = {};
                  hideData[`${renderContainerId}_show`] = false;
                  pageInstance.setData(hideData);
                  return reject('找不到Canvas节点');
                }
                
                console.log('找到PDF Canvas节点:', canvasRes);
                
                // 4. 解析Markdown为可渲染的内容
                const parsedContent = parseMarkdownForCanvas(markdown);
                
                // 5. 计算内容需要的页数
                const pageSize = calculatePageSize(parsedContent);
                
                // 6. 逐页渲染并导出
                renderMultiplePages(
                  canvasRes.node, 
                  parsedContent, 
                  docTitle, 
                  filename, 
                  pageSize.pages,
                  resolve, 
                  reject
                ).finally(() => {
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
        } catch (error) {
          console.error('创建查询选择器错误:', error);
          wx.hideLoading();
          const hideData = {};
          hideData[`${renderContainerId}_show`] = false;
          pageInstance.setData(hideData);
          reject('创建查询选择器错误: ' + error.message);
        }
      }, 500);
    });
  });
}

/**
 * 计算内容需要的页数
 */
function calculatePageSize(content) {
  // 定义标准页面尺寸
  const pageWidth = 750;
  const pageHeight = 1000;
  const margin = 40;
  const headerHeight = 100; // 标题区域高度
  const footerHeight = 40;  // 页脚区域高度
  const contentHeight = pageHeight - headerHeight - footerHeight;
  
  // 估算每个内容项在页面上占用的高度
  const estimatedHeights = content.map(item => {
    switch (item.type) {
      case 'h1': return 50;
      case 'h2': return 40;
      case 'h3': return 35;
      case 'paragraph': {
        // 估算段落行数
        const lineHeight = 24;
        const charsPerLine = Math.floor((pageWidth - margin * 2) / 18); // 假设每个字符宽度18px
        const lines = Math.ceil(item.content.length / charsPerLine);
        return lines * lineHeight + 16; // 加上段落间距
      }
      case 'list-item': {
        const lineHeight = 24;
        const charsPerLine = Math.floor((pageWidth - margin * 2 - 20) / 18); // 列表项有缩进
        const lines = Math.ceil(item.content.length / charsPerLine);
        return lines * lineHeight + 8; // 加上列表项间距
      }
      case 'code':
      case 'code-delimiter':
        return 30;
      case 'blockquote': {
        const lineHeight = 24;
        const charsPerLine = Math.floor((pageWidth - margin * 2 - 20) / 18); // 引用有缩进
        const lines = Math.ceil(item.content.length / charsPerLine);
        return lines * lineHeight + 20; // 加上引用间距
      }
      case 'hr': return 30;
      case 'blank': return 10;
      default: return 20;
    }
  });
  
  // 计算总高度
  const totalHeight = estimatedHeights.reduce((sum, height) => sum + height, 0);
  
  // 计算需要的页数
  const pages = Math.max(1, Math.ceil(totalHeight / contentHeight));
  
  return {
    pages,
    totalHeight,
    contentHeight,
    pageHeight,
    pageWidth
  };
}

/**
 * 多页渲染处理函数
 */
async function renderMultiplePages(canvas, content, title, filename, pageCount, resolve, reject) {
  try {
    // 确保页数至少为1
    pageCount = Math.max(1, pageCount);
    console.log(`需要渲染 ${pageCount} 页`);
    
    // 定义页面尺寸
    const pageWidth = 750;
    const pageHeight = 1000;
    
    // 存储所有页面的临时文件路径
    const pageFilePaths = [];
    
    // 设置Canvas尺寸
    const dpr = wx.getSystemInfoSync().pixelRatio || 2;
    canvas.width = pageWidth * dpr;
    canvas.height = pageHeight * dpr;
    
    // 获取绘图上下文
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('无法获取Canvas上下文'));
    }
    
    // 计算每页应该显示的内容
    const contentPerPage = splitContentByPages(content, pageCount);
    
    // 逐页渲染
    for (let i = 0; i < pageCount; i++) {
      // 重置canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 重新应用缩放
      ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
      ctx.scale(dpr, dpr);
      
      // 渲染当前页 - 给予足够时间完成渲染
      await new Promise(resolve => setTimeout(resolve, 100));
      await renderSinglePage(ctx, contentPerPage[i], title, pageWidth, pageHeight, i + 1, pageCount);
      
      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 导出为图片
      try {
        const pageFilePath = await exportCanvasToImage(canvas, `${filename.replace(/\.pdf$/i, '')}_page${i+1}.png`);
        if (pageFilePath) {
          pageFilePaths.push(pageFilePath);
          console.log(`成功导出第${i+1}页: ${pageFilePath}`);
        }
      } catch (e) {
        console.error(`导出第${i+1}页失败:`, e);
      }
      
      // 更新加载提示
      wx.showLoading({
        title: `渲染页面 ${i+1}/${pageCount}...`,
        mask: true
      });
    }
    
    // 保存多页图片
    if (pageFilePaths.length === 0) {
      wx.hideLoading();
      return reject(new Error('没有成功导出任何页面'));
    } else if (pageFilePaths.length === 1) {
      // 只有一页，直接保存
      savePdfImage(pageFilePaths[0], filename, resolve, reject);
    } else {
      // 多页，打包成zip或显示多页保存选项
      saveMultipleImages(pageFilePaths, filename, resolve, reject);
    }
  } catch (error) {
    console.error('渲染多页PDF出错:', error);
    reject(error);
  }
}

/**
 * 将内容分割成多页
 */
function splitContentByPages(content, pageCount) {
  // 如果只有一页，返回所有内容
  if (pageCount <= 1) {
    return [content];
  }
  
  // 根据内容长度均匀分割
  const contentPerPage = [];
  const itemsPerPage = Math.ceil(content.length / pageCount);
  
  for (let i = 0; i < pageCount; i++) {
    const startIndex = i * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, content.length);
    const pageContent = content.slice(startIndex, endIndex);
    
    // 确保每页都有内容
    if (pageContent.length > 0) {
      contentPerPage.push(pageContent);
    }
  }
  
  return contentPerPage;
}

/**
 * 渲染单页内容
 */
async function renderSinglePage(ctx, content, title, width, height, pageNumber, totalPages) {
  // 定义样式
  const styles = {
    h1: { font: 'bold 32px Arial', color: '#333333', marginTop: 20, marginBottom: 10 },
    h2: { font: 'bold 28px Arial', color: '#333333', marginTop: 16, marginBottom: 8 },
    h3: { font: 'bold 24px Arial', color: '#333333', marginTop: 14, marginBottom: 7 },
    paragraph: { font: '18px Arial', color: '#333333', marginTop: 8, marginBottom: 8, lineHeight: 24 },
    code: { font: '16px Courier', color: '#333333', background: '#f6f8fa', marginTop: 5, marginBottom: 5 },
    'list-item': { font: '18px Arial', color: '#333333', marginTop: 4, marginBottom: 4, indent: 20, lineHeight: 24 },
    blockquote: { font: 'italic 18px Arial', color: '#666666', marginTop: 10, marginBottom: 10, indent: 20, lineHeight: 24 },
    hr: { color: '#dddddd', marginTop: 15, marginBottom: 15 }
  };
  
  // 绘制背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // 绘制标题区域
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, 80);
  ctx.fillStyle = '#2c80ff';
  ctx.fillRect(0, 80, width, 3);
  
  // 显示标题
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'center';
  // 第一页显示完整标题，后续页面显示"标题 (续XX)"
  if (pageNumber === 1) {
    ctx.fillText(title, width / 2, 50);
  } else {
    ctx.fillText(`${title} (续${pageNumber})`, width / 2, 50);
  }
  
  // 重置对齐方式
  ctx.textAlign = 'left';
  
  // 内容绘制起点
  let y = 100;
  const margin = 40; // 左右边距
  
  // 绘制内容
  for (const item of content) {
    // 如果已经超出页面，则停止渲染
    if (y > height - 60) {
      break;
    }
    
    const style = styles[item.type] || styles.paragraph;
    
    // 应用样式
    ctx.font = style.font || '18px Arial';
    ctx.fillStyle = style.color || '#333333';
    
    // 根据内容类型渲染
    switch (item.type) {
      case 'h1':
      case 'h2':
      case 'h3':
        y += style.marginTop || 0;
        ctx.fillText(item.content, margin, y);
        y += style.marginBottom || 0;
        break;
        
      case 'paragraph':
        y += style.marginTop || 0;
        // 处理文本换行
        const lines = getTextLines(ctx, item.content, width - margin * 2);
        for (const line of lines) {
          ctx.fillText(line, margin, y);
          y += style.lineHeight || 20;
        }
        y += style.marginBottom || 0;
        break;
        
      case 'list-item':
        y += style.marginTop || 0;
        // 绘制列表符号
        if (item.listType === 'unordered') {
          ctx.beginPath();
          ctx.arc(margin + 5, y - 5, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // 数字编号 (这里简化处理)
          ctx.fillText('•', margin, y);
        }
        
        // 处理文本换行
        const listLines = getTextLines(ctx, item.content, width - (margin + style.indent) * 2);
        for (const line of listLines) {
          ctx.fillText(line, margin + style.indent, y);
          y += style.lineHeight || 20;
        }
        y += style.marginBottom || 0;
        break;
        
      case 'code':
      case 'code-delimiter':
        y += style.marginTop || 0;
        // 绘制代码背景
        if (item.type === 'code') {
          ctx.fillStyle = style.background || '#f6f8fa';
          ctx.fillRect(margin - 5, y - 15, width - margin * 2 + 10, style.lineHeight || 20);
          ctx.fillStyle = style.color || '#333333';
        }
        ctx.fillText(item.content, margin, y);
        y += style.lineHeight || 20;
        y += style.marginBottom || 0;
        break;
        
      case 'blockquote':
        y += style.marginTop || 0;
        // 绘制引用线
        ctx.fillStyle = '#dddddd';
        ctx.fillRect(margin, y - 15, 4, style.lineHeight || 20);
        ctx.fillStyle = style.color || '#666666';
        
        // 处理文本换行
        const quoteLines = getTextLines(ctx, item.content, width - (margin + style.indent) * 2);
        for (const line of quoteLines) {
          ctx.fillText(line, margin + style.indent, y);
          y += style.lineHeight || 20;
        }
        y += style.marginBottom || 0;
        break;
        
      case 'hr':
        y += style.marginTop || 0;
        ctx.fillStyle = style.color || '#dddddd';
        ctx.fillRect(margin, y, width - margin * 2, 1);
        y += style.marginBottom || 0;
        break;
        
      case 'blank':
        y += 10; // 空行高度
        break;
    }
  }
  
  // 添加页脚
  ctx.font = '14px Arial';
  ctx.fillStyle = '#999999';
  ctx.textAlign = 'center';
  ctx.fillText(`由 MarkMark 生成 - 第${pageNumber}页/共${totalPages}页`, width / 2, height - 20);
  
  return true;
}

/**
 * 导出Canvas为图片
 */
function exportCanvasToImage(canvas, filename) {
  return new Promise((resolve, reject) => {
    try {
      // 导出图片
      wx.canvasToTempFilePath({
        canvas: canvas,
        x: 0,
        y: 0,
        width: canvas.width / (wx.getSystemInfoSync().pixelRatio || 2),
        height: canvas.height / (wx.getSystemInfoSync().pixelRatio || 2),
        destWidth: canvas.width,
        destHeight: canvas.height,
        fileType: 'png',
        quality: 1.0,
        success: (res) => {
          if (!res.tempFilePath) {
            console.error('导出图片失败: 未获取到临时文件路径');
            return reject(new Error('导出图片失败: 未获取到临时文件路径'));
          }
          
          // 检查临时文件是否存在
          wx.getFileSystemManager().access({
            path: res.tempFilePath,
            success: () => {
              // 将临时文件保存到用户目录
              const targetPath = `${wx.env.USER_DATA_PATH}/${filename}`;
              wx.getFileSystemManager().saveFile({
                tempFilePath: res.tempFilePath,
                filePath: targetPath,
                success: () => {
                  console.log(`页面导出成功: ${targetPath}`);
                  resolve(targetPath);
                },
                fail: (err) => {
                  console.error('保存页面文件失败:', err);
                  // 尝试直接使用临时文件路径
                  resolve(res.tempFilePath);
                }
              });
            },
            fail: (err) => {
              console.error('临时文件不存在:', err);
              reject(new Error('导出的临时文件不存在'));
            }
          });
        },
        fail: (err) => {
          console.error('Canvas导出图片失败:', err);
          reject(new Error('Canvas导出图片失败: ' + (err.errMsg || JSON.stringify(err))));
        }
      });
    } catch (err) {
      console.error('导出图片过程中发生异常:', err);
      reject(err);
    }
  });
}

/**
 * 保存多页图片
 */
function saveMultipleImages(filePaths, filename, resolve, reject) {
  wx.hideLoading();
  
  // 显示保存选项
  wx.showModal({
    title: '导出成功',
    content: `文档已导出为 ${filePaths.length} 页图片，是否保存全部页面？`,
    confirmText: '保存',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 保存全部页面
        wx.showActionSheet({
          itemList: ['保存到相册', '保存到本地'],
          success: (actionRes) => {
            if (actionRes.tapIndex === 0) {
              // 逐页保存到相册
              saveImagesToAlbum(filePaths, 0, resolve);
            } else {
              // 保存到本地
              saveImagesToLocalStorage(filePaths, filename, resolve, reject);
            }
          },
          fail: () => {
            // 用户取消，仍然视为成功，返回第一页路径
            resolve(filePaths[0]);
          }
        });
      } else {
        // 用户取消保存
        wx.showToast({
          title: '已取消保存',
          icon: 'none'
        });
        resolve(filePaths[0]);
      }
    }
  });
}

/**
 * 逐页保存图片到相册
 */
function saveImagesToAlbum(filePaths, index, resolve) {
  if (index >= filePaths.length) {
    // 全部保存完成
    wx.hideLoading();
    wx.showToast({
      title: '全部页面已保存到相册',
      icon: 'success'
    });
    resolve(filePaths[0]);
    return;
  }
  
  // 保存当前页
  try {
    // 检查文件是否存在
    wx.getFileSystemManager().access({
      path: filePaths[index],
      success: () => {
        // 文件存在，保存到相册
        wx.saveImageToPhotosAlbum({
          filePath: filePaths[index],
          success: () => {
            // 更新进度
            wx.showLoading({
              title: `保存中 ${index+1}/${filePaths.length}`,
              mask: true
            });
            
            // 保存下一页
            setTimeout(() => {
              saveImagesToAlbum(filePaths, index + 1, resolve);
            }, 500); // 增加延迟，给系统足够时间完成保存
          },
          fail: (err) => {
            wx.hideLoading();
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
                  // 继续保存后面的图片
                  setTimeout(() => {
                    saveImagesToAlbum(filePaths, index + 1, resolve);
                  }, 500);
                }
              });
            } else {
              wx.showToast({
                title: '保存第' + (index+1) + '页失败',
                icon: 'none'
              });
              // 继续保存后面的图片
              setTimeout(() => {
                saveImagesToAlbum(filePaths, index + 1, resolve);
              }, 500);
            }
          }
        });
      },
      fail: (err) => {
        console.error(`文件不存在: ${filePaths[index]}`, err);
        // 跳过这个文件，继续下一个
        setTimeout(() => {
          saveImagesToAlbum(filePaths, index + 1, resolve);
        }, 300);
      }
    });
  } catch (err) {
    console.error('保存过程中出错:', err);
    // 继续保存后面的图片
    setTimeout(() => {
      saveImagesToAlbum(filePaths, index + 1, resolve);
    }, 300);
  }
}

/**
 * 保存多页图片到本地存储
 */
function saveImagesToLocalStorage(filePaths, filename, resolve, reject) {
  wx.hideLoading();
  
  // 由于小程序限制，无法直接生成PDF，只能提供多个图片文件
  const baseFileName = filename.replace(/\.pdf$/i, '');
  
  if (filePaths.length === 0) {
    wx.showToast({
      title: '导出失败，没有生成有效图片',
      icon: 'none'
    });
    return reject(new Error('没有有效的图片文件'));
  }
  
  // 创建一个包含所有页面信息的字符串
  const firstFilePath = filePaths[0];
  let pageInfoMessage = `共 ${filePaths.length} 页，`;
  
  if (filePaths.length === 1) {
    pageInfoMessage += "保存到本地存储？";
  } else {
    pageInfoMessage += "只能一次保存一页。保存第1页到本地存储？";
  }
  
  wx.showModal({
    title: '导出完成',
    content: pageInfoMessage,
    confirmText: '保存',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 保存第一页
        saveToLocalStorage(firstFilePath, `${baseFileName}_page1.png`)
          .then(() => {
            if (filePaths.length > 1) {
              // 如果有多页，询问是否继续保存下一页
              showSaveNextPageOption(filePaths, 1, baseFileName, resolve);
            } else {
              resolve(firstFilePath);
            }
          })
          .catch(error => {
            console.error('保存失败:', error);
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
            resolve(firstFilePath); // 仍然视为成功完成导出
          });
      } else {
        resolve(firstFilePath);
      }
    }
  });
}

/**
 * 显示保存下一页选项
 */
function showSaveNextPageOption(filePaths, currentIndex, baseFileName, resolve) {
  if (currentIndex >= filePaths.length - 1) {
    // 已经是最后一页
    wx.showToast({
      title: '所有页面已处理',
      icon: 'success'
    });
    resolve(filePaths[0]);
    return;
  }
  
  const nextIndex = currentIndex + 1;
  wx.showModal({
    title: '继续保存',
    content: `是否保存第${nextIndex + 1}页？`,
    confirmText: '保存',
    cancelText: '完成',
    success: (res) => {
      if (res.confirm) {
        // 保存下一页
        saveToLocalStorage(filePaths[nextIndex], `${baseFileName}_page${nextIndex + 1}.png`)
          .then(() => {
            // 继续询问下一页
            showSaveNextPageOption(filePaths, nextIndex, baseFileName, resolve);
          })
          .catch(error => {
            console.error(`保存第${nextIndex + 1}页失败:`, error);
            wx.showToast({
              title: `保存第${nextIndex + 1}页失败`,
              icon: 'none'
            });
            // 继续询问下一页
            showSaveNextPageOption(filePaths, nextIndex, baseFileName, resolve);
          });
      } else {
        // 用户选择完成
        wx.showToast({
          title: '保存完成',
          icon: 'success'
        });
        resolve(filePaths[0]);
      }
    }
  });
}

/**
 * 从Markdown中提取标题
 */
function extractTitle(markdown) {
  if (!markdown) return '';
  
  // 尝试从第一个h1标题提取
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  
  // 如果没有h1标题，尝试使用第一行非空内容
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
      return trimmed.length > 30 ? trimmed.substring(0, 30) + '...' : trimmed;
    }
  }
  
  return '';
}

/**
 * 解析Markdown为易于Canvas渲染的格式
 */
function parseMarkdownForCanvas(markdown) {
  // 分割成行
  const lines = markdown.split('\n');
  const result = [];
  let inCodeBlock = false;
  let currentList = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 处理代码块
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push({
        type: 'code-delimiter',
        content: line.trim()
      });
      continue;
    }
    
    if (inCodeBlock) {
      result.push({
        type: 'code',
        content: line
      });
      continue;
    }
    
    // 处理标题
    if (line.startsWith('# ')) {
      result.push({
        type: 'h1',
        content: line.substring(2).trim()
      });
      continue;
    }
    
    if (line.startsWith('## ')) {
      result.push({
        type: 'h2',
        content: line.substring(3).trim()
      });
      continue;
    }
    
    if (line.startsWith('### ')) {
      result.push({
        type: 'h3',
        content: line.substring(4).trim()
      });
      continue;
    }
    
    // 处理列表
    if (line.match(/^\s*-\s+/)) {
      const content = line.replace(/^\s*-\s+/, '').trim();
      result.push({
        type: 'list-item',
        listType: 'unordered',
        content: content
      });
      continue;
    }
    
    if (line.match(/^\s*\d+\.\s+/)) {
      const content = line.replace(/^\s*\d+\.\s+/, '').trim();
      result.push({
        type: 'list-item',
        listType: 'ordered',
        content: content
      });
      continue;
    }
    
    // 处理引用
    if (line.startsWith('> ')) {
      result.push({
        type: 'blockquote',
        content: line.substring(2).trim()
      });
      continue;
    }
    
    // 处理分隔线
    if (line.trim().match(/^-{3,}$|^={3,}$/)) {
      result.push({
        type: 'hr'
      });
      continue;
    }
    
    // 处理普通段落
    if (line.trim() === '') {
      result.push({
        type: 'blank'
      });
    } else {
      // 处理粗体、斜体和链接
      result.push({
        type: 'paragraph',
        content: line.trim() 
      });
    }
  }
  
  return result;
}

/**
 * 将文本分割成多行以适应指定宽度
 */
function getTextLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  // 中文文本处理
  if (/[\u4e00-\u9fa5]/.test(text)) {
    // 简单按字符长度截取
    const charsPerLine = Math.floor(maxWidth / 18); // 假设每个中文字符宽度为18px
    let i = 0;
    while (i < text.length) {
      lines.push(text.substring(i, i + charsPerLine));
      i += charsPerLine;
    }
    return lines;
  }
  
  // 英文文本处理
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
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
        console.log('PDF图片文件已保存:', filePath);
        
        // 提示用户选择操作 - 与其他格式导出保持一致
        wx.showModal({
          title: '导出成功',
          content: `已导出 "${filename.replace(/\.pdf$/i, '.png')}"`,
          confirmText: '打开文件',
          cancelText: '保存本地',
          success: (res) => {
            if (res.confirm) {
              // 尝试打开文件
              wx.openDocument({
                filePath: filePath,
                fileType: 'image',
                success: () => {
                  console.log('打开PDF图片文件成功');
                  resolve(filePath);
                },
                fail: (openErr) => {
                  console.error('打开文件失败:', openErr);
                  // 如果打开失败，尝试保存到本地或相册
                  wx.showModal({
                    title: '提示',
                    content: '无法直接打开图片，是否保存到相册？',
                    confirmText: '保存到相册',
                    cancelText: '保存到本地',
                    success: (modalRes) => {
                      if (modalRes.confirm) {
                        // 保存到相册
                        saveToPhotoAlbum(filePath, resolve);
                      } else {
                        // 保存到本地
                        saveToLocalStorage(filePath, filename.replace(/\.pdf$/i, '.png'))
                          .then(resolve)
                          .catch(reject);
                      }
                    }
                  });
                }
              });
            } else if (res.cancel) {
              // 用户选择保存到本地 - 提供保存到相册或本地的选项
              wx.showActionSheet({
                itemList: ['保存到相册', '保存到本地'],
                success: (actionRes) => {
                  if (actionRes.tapIndex === 0) {
                    // 保存到相册
                    saveToPhotoAlbum(filePath, resolve);
                  } else {
                    // 保存到本地
                    saveToLocalStorage(filePath, filename.replace(/\.pdf$/i, '.png'))
                      .then(resolve)
                      .catch(reject);
                  }
                },
                fail: () => {
                  // 用户取消，仍然视为成功
                  resolve(filePath);
                }
              });
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

// 辅助函数：保存图片到相册
function saveToPhotoAlbum(filePath, resolve) {
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