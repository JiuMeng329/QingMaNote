// utils/exportUtil.js

// 引入自定义Markdown解析工具
const { markdownToHtml } = require('./markdown.js');

/**
 * 导出Markdown文件
 * @param {string} content Markdown内容
 * @param {string} filename 文件名(默认:document.md)
 */
export function exportMarkdown(content, filename = 'document.md') {
  // 使用 FileSystemManager 保存，避免 downloadFile 的 data URL 长度限制和编码问题
  const fs = wx.getFileSystemManager();
  const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;

  fs.writeFile({
    filePath: filePath,
    data: content,
    encoding: 'utf8',
    success: () => {
      wx.showToast({
        title: `已保存到: ${filePath}`,
        icon: 'none',
        duration: 3000
      });
      // 可选：提供分享或打开文件的选项
      // wx.shareFileMessage({ filePath: filePath });
      // wx.openDocument({ filePath: filePath });
    },
    fail: (err) => {
      console.error('Markdown 保存失败:', err);
      wx.showToast({ title: 'Markdown导出失败', icon: 'error' });
    }
  });
}

/**
 * 导出HTML文件
 * @param {string} markdown Markdown内容
 * @param {string} title 文档标题，用于HTML <title>
 * @param {string} filename 文件名(默认:document.html)
 */
export function exportHTML(markdown, title = 'Document', filename = 'document.html') {
  // 基础CSS样式 - 可根据主题变量调整
  const css = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 20px auto; padding: 20px; background-color: #fff; color: #333; }
    h1, h2, h3, h4, h5, h6 { color: #111; border-bottom: 1px solid #eee; padding-bottom: 0.3em; margin-top: 1.5em; margin-bottom: 1em; }
    code { background: #f5f5f5; padding: 0.2em 0.4em; margin: 0; font-size: 85%; border-radius: 3px; font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, Courier, monospace; }
    pre { background: #f8f8f8; padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; border-radius: 3px; }
    pre code { padding: 0; margin: 0; font-size: 100%; background: transparent; border-radius: 0; }
    blockquote { border-left: 4px solid #ddd; padding: 0 15px; color: #777; margin: 0 0 16px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 16px; display: block; overflow: auto; }
    th, td { border: 1px solid #ddd; padding: 6px 13px; }
    th { font-weight: 600; }
    img { max-width: 100%; box-sizing: content-box; background-color: #fff; }
    /* Add more styles as needed, maybe theme-specific later */
  `;

  let html = '';
  try {
    html = markdownToHtml(markdown || '');
  } catch (e) {
    console.error('Markdown parsing error:', e);
    html = `<pre>Error parsing Markdown:\n${(markdown||'').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html lang=\"zh-CN\">
    <head>
      <meta charset=\"UTF-8\">
      <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
      <title>${title}</title>
      <style>${css}</style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;

  const fs = wx.getFileSystemManager();
  const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;

  fs.writeFile({
    filePath: filePath,
    data: fullHtml,
    encoding: 'utf8',
    success: () => {
      wx.showToast({
        title: `HTML已保存到: ${filePath}`,
        icon: 'none',
        duration: 3000
      });
    },
    fail: (err) => {
      console.error('HTML 保存失败:', err);
      wx.showToast({ title: 'HTML导出失败', icon: 'error' });
    }
  });
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
      return reject('Invalid page instance provided for PDF export.');
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
    
    pageInstance.setData(tempPdfData, () => {
      wx.nextTick(() => {
        // 3. 获取渲染后的节点信息
        const query = wx.createSelectorQuery().in(pageInstance); // 指定在哪个页面实例查询
        query.select(`#${renderContainerId}`)
          .fields({ node: true, size: true })
          .exec(res => {
            // 完成后隐藏渲染容器
            const hideData = {};
            hideData[`${renderContainerId}_show`] = false;
            pageInstance.setData(hideData);

            if (!res || !res[0] || !res[0].node) {
              console.error('PDF Export Error: Could not find render node #' + renderContainerId, res);
              
              // 尝试获取canvas元素
              const canvasQuery = wx.createSelectorQuery().in(pageInstance);
              canvasQuery.select('#pdf-canvas')
                .fields({ node: true, size: true })
                .exec(canvasRes => {
                  if (!canvasRes || !canvasRes[0] || !canvasRes[0].node) {
                    return reject('找不到渲染节点和Canvas');
                  }
                  
                  // 使用找到的canvas继续处理
                  processPdfCanvas(canvasRes[0], pageInstance, filename, resolve, reject);
                });
              return;
            }
            
            // 使用找到的节点继续处理
            processPdfCanvas(res[0], pageInstance, filename, resolve, reject);
          });
      }); // End nextTick
    }); // End setData
  }); // End Promise
}

// 提取处理canvas的逻辑为单独函数
function processPdfCanvas(res, pageInstance, filename, resolve, reject) {
  const node = res.node;
  const { width, height } = res;

  if (!width || !height) {
    console.error('PDF Export Error: Render node has zero width or height.');
    return reject('渲染节点尺寸异常');
  }
  
  // 4. 创建离屏 Canvas (如果可用且需要，否则使用组件的 Canvas)
  // 注意：离屏 Canvas 可能不适用于所有场景，这里优先使用组件获取的 Canvas
  let canvas = null;
  try {
      canvas = node.node ? node.node : node._owner ? node._owner.node : node; // 尝试获取 Canvas 实例
  } catch(canvasErr) { 
      console.error('获取 Canvas 失败:', canvasErr);
      return reject('无法获取 Canvas 对象');
  }

  if (!canvas || typeof canvas.getContext !== 'function') {
     console.error('无效的 Canvas 对象:', canvas);
     return reject('无效的 Canvas 对象');
  }
  
  const ctx = canvas.getContext('2d');
  
  // 5. 设置canvas尺寸（提高分辨率）
  const dpr = wx.getSystemInfoSync().pixelRatio || 2;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  
  // 6. 渲染到canvas (确保背景是白色)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const renderToCanvas = () => {
      return new Promise((renderResolve, renderReject) => {
          try {
              const drawOptions = {
                  canvas: canvas,
                  width: width,
                  height: height,
                  done: () => {
                      console.log('Canvas 渲染完成');
                      renderResolve();
                  },
                  fail: (err) => {
                      console.error('Canvas 渲染失败:', err);
                      renderReject(err);
                  }
              };
              // 检查是否有 draw 方法 (新版 Canvas API)
              if (typeof node.draw === 'function') {
                   node.draw(drawOptions);
              } else if (typeof node.requestToRender === 'function') {
                 // 旧版或兼容模式
                 node.requestToRender().then(renderResolve).catch(renderReject);
              } else {
                  renderReject('找不到 Canvas 绘制方法');
              }
          } catch (renderErr) {
              renderReject(renderErr);
          }
      });
  };

  renderToCanvas().then(() => {
    // 7. 导出为图片
    wx.canvasToTempFilePath({
      canvas: canvas,
      fileType: 'png',
      quality: 1.0, // 最高质量
      success: (imgRes) => {
        // 8. 保存图片（简易PDF替代方案）
        const fs = wx.getFileSystemManager();
        const filePath = `${wx.env.USER_DATA_PATH}/${filename.replace(/\.pdf$/i, '.png')}`; // 保存为png

        fs.saveFile({
          tempFilePath: imgRes.tempFilePath,
          filePath: filePath,
          success: () => {
            wx.showToast({
              title: `图片已保存到: ${filePath}`,
              icon: 'none',
              duration: 3000
            });
            resolve(filePath);
          },
          fail: (saveErr) => {
            console.error('图片保存失败:', saveErr);
            reject('图片保存失败');
          }
        });
      },
      fail: (canvasErr) => {
        console.error('Canvas 导出图片失败:', canvasErr);
        reject('Canvas 导出图片失败');
      }
    }, pageInstance); // 必须传入组件实例
  }).catch(err => {
      console.error('渲染到 Canvas 失败:', err);
      reject('渲染到 Canvas 失败');
  });
}