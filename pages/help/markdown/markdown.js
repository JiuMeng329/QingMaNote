// pages/help/markdown/markdown.js
Page({
  data: {
    content: '',
    markdownContent: `# Markdown语法指南

## 标题
使用 # 号可表示 1-6 级标题，一级标题对应一个 # 号，二级标题对应两个 # 号，以此类推。

## 强调
*斜体*或_斜体_
**粗体**或__粗体__
***粗斜体***或___粗斜体___

## 列表
### 无序列表
* 项目1
* 项目2
* 项目3

### 有序列表
1. 项目1
2. 项目2
3. 项目3

## 链接和图片
[链接文字](链接地址)
![图片描述](图片地址)

## 引用
> 引用文本

## 代码
行内代码 \`code\`

代码块：
\`\`\`
function example() {
  console.log("Hello, Markdown!");
}
\`\`\`

## 表格
| 表头1 | 表头2 |
| ----- | ----- |
| 单元格1 | 单元格2 |
| 单元格3 | 单元格4 |

## 分割线
---
`,
    currentTheme: 'light',
    fontStyleClass: ''
  },

  onLoad() {
    // 设置主题
    this.updateTheme();
    // 应用字体样式
    this.applyGlobalFontStyle();
    
    // 将Markdown内容转换为HTML
    this.renderMarkdown();
  },

  onShow() {
    // 每次显示页面时更新主题
    this.updateTheme();
    // 应用字体样式
    this.applyGlobalFontStyle();
  },

  /**
   * 更新主题
   */
  updateTheme() {
    const app = getApp();
    
    // 获取当前主题
    if (app.getCurrentTheme) {
      const theme = app.getCurrentTheme();
      this.setData({ currentTheme: theme });
    }
  },

  /**
   * 应用全局字体样式
   */
  applyGlobalFontStyle: function() {
    const app = getApp();
    const fontStyleClass = app.getGlobalStyleClass();
    this.setData({ fontStyleClass });
    console.log('Markdown help page applying font style:', fontStyleClass);
  },

  /**
   * 响应样式变化
   */
  onStyleChange: function() {
    console.log('Markdown help page received style change');
    this.applyGlobalFontStyle();
    // 重新渲染Markdown以应用新字体样式
    this.renderMarkdown();
  },

  /**
   * 主题变化回调
   */
  onThemeChange(theme) {
    console.log('Markdown help page received theme change:', theme);
    this.setData({ currentTheme: theme });
    // 重新渲染Markdown以应用新主题
    this.renderMarkdown();
  },

  /**
   * 渲染Markdown内容
   */
  renderMarkdown() {
    const app = getApp();
    if (app.globalData && app.globalData.markdownUtils) {
      const html = app.globalData.markdownUtils.markdownToHtml(this.data.markdownContent);
      this.setData({ content: html });
    } else {
      // 如果markdownUtils不可用，尝试导入
      const markdownUtils = require('../../../utils/markdown');
      if (markdownUtils && markdownUtils.markdownToHtml) {
        const html = markdownUtils.markdownToHtml(this.data.markdownContent);
        this.setData({ content: html });
      } else {
        // 如果转换失败，直接显示原始Markdown
        console.error('Markdown转换工具不可用');
        this.setData({ 
          content: `<div style="white-space: pre-wrap; font-family: monospace;">${this.data.markdownContent}</div>` 
        });
      }
    }
  }
});