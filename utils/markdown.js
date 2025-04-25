// utils/markdown.js

/**
 * Markdown解析工具
 * 提供Markdown到HTML的转换功能
 */

// 导入highlight.js模块
const hljs = require('./highlight');

/**
 * 将Markdown文本转换为HTML
 * @param {String} markdown Markdown文本
 * @return {String} HTML文本
 */
const markdownToHtml = function(markdown) {
  if (!markdown) return '';
  
  // 首先处理代码块，避免内部内容被其他规则影响
  let codeBlocks = [];
  let codeBlockCount = 0;
  
  // 提取代码块并替换为占位符
  markdown = markdown.replace(/```(\w*)\n([\s\S]+?)```/g, function(match, language, code) {
    const placeholder = `__CODE_BLOCK_${codeBlockCount}__`;
    codeBlocks.push({
      placeholder: placeholder,
      language: language,
      code: code
    });
    codeBlockCount++;
    return placeholder;
  });
  
  let html = markdown
    // 处理标题
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
    .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
    
    // 处理粗体和斜体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    
    // 处理链接和图片
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    
    // 处理行内代码，转义HTML特殊字符
    .replace(/`([^`]+?)`/g, function(match, code) {
      const escapedCode = hljs.escapeHtml(code);
      return `<code class="inline-code">${escapedCode}</code>`;
    })
    
    // 处理水平线
    .replace(/^---+$/gm, '<hr>')
    
    // 处理任务列表
    .replace(/^- \[([ x])\] (.+)$/gm, function(match, checked, content) {
      return `<li class="task-list-item"><input type="checkbox" ${checked === 'x' ? 'checked' : ''} disabled>${content}</li>`;
    })
    
    // 处理无序列表
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    
    // 处理有序列表
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    
    // 处理引用
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    
    // 处理表格
    .replace(/\|(.+)\|\s*\n\|\s*[-:]+[-|\s:]*\s*\n((\|.+\|\s*\n)+)/g, function(match, header, rows) {
      const headers = header.split('|').map(cell => cell.trim()).filter(cell => cell);
      const headerHtml = headers.map(cell => `<th>${cell}</th>`).join('');
      
      const rowsHtml = rows.split('\n')
        .filter(row => row.trim())
        .map(row => {
          const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
          return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
        })
        .join('');
      
      return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
    })
    
    // 处理段落
    .replace(/^(?!<[h|ul|ol|li|blockquote|code|pre|table])(.+)$/gm, '<p>$1</p>');
  
  // 处理列表
  html = html.replace(/<li>(.+?)<\/li>/g, function(match) {
    if (html.indexOf('<ul>') === -1 && html.indexOf('<ol>') === -1) {
      return `<ul>${match}</ul>`;
    }
    return match;
  });

  // 处理任务列表
  html = html.replace(/<li class="task-list-item">(.+?)<\/li>/g, function(match) {
    if (html.indexOf('<ul class="task-list">') === -1) {
      return `<ul class="task-list">${match}</ul>`;
    }
    return match;
  });
  
  // 将连续的<li>元素包装在<ul>或<ol>中
  html = html.replace(/(<li>.+?<\/li>)\s*(<li>.+?<\/li>)/g, '$1$2');
  
  // 将连续的任务列表项包装起来
  html = html.replace(/(<li class="task-list-item">.+?<\/li>)\s*(<li class="task-list-item">.+?<\/li>)/g, '$1$2');
  
  // 处理换行
  html = html.replace(/\n\n/g, '<br>');
  
  // 恢复代码块，使用highlight.js进行高亮
  codeBlocks.forEach(block => {
    // 使用highlight.js高亮代码
    let highlightedCode;
    
    if (block.language && block.language.trim()) {
      // 如果指定了语言，使用对应的高亮
      const result = hljs.highlight(block.code.trim(), { language: block.language.trim() });
      highlightedCode = result.value;
    } else {
      // 否则尝试自动检测语言
      const result = hljs.highlightAuto(block.code.trim());
      highlightedCode = result.value;
    }
    
    // 为代码块添加标记
    const languageClass = block.language ? ` language-${block.language}` : '';
    const languageLabel = block.language ? `<div class="code-language-label">${block.language}</div>` : '';
    
    // 创建代码块HTML
    const codeBlockHtml = `<pre class="code-block hljs${languageClass}">${languageLabel}<code>${highlightedCode}</code></pre>`;
    
    // 替换占位符
    html = html.replace(block.placeholder, codeBlockHtml);
  });
  
  return html;
};

/**
 * 获取Markdown文本的纯文本内容（去除标记）
 * @param {String} markdown Markdown文本
 * @return {String} 纯文本内容
 */
const getPlainText = function(markdown) {
  if (!markdown) return '';
  
  return markdown
    .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1') // 链接
    .replace(/!\[([^\]]*)\]\([^\)]*\)/g, '$1') // 图片
    .replace(/\*\*([^*]*)\*\*/g, '$1') // 粗体
    .replace(/\*([^*]*)\*/g, '$1') // 斜体
    .replace(/#{1,6}\s?([^#]*)/g, '$1') // 标题
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // 代码
    .replace(/~~([^~]*)~~/g, '$1') // 删除线
    .replace(/^\s*[\-*]\s+/gm, '') // 无序列表
    .replace(/^\s*\d+\.\s+/gm, '') // 有序列表
    .replace(/^\s*- \[([ x])\]\s+/gm, '') // 任务列表
    .replace(/^\s*>/gm, '') // 引用
    .replace(/\|([^\|]*)\|/g, '$1') // 表格
    .replace(/^---+$/gm, '') // 水平线
    .trim();
};

/**
 * 计算Markdown文本的字数
 * @param {String} markdown Markdown文本
 * @return {Number} 字数
 */
const countWords = function(markdown) {
  const plainText = getPlainText(markdown);
  return plainText.length;
};

/**
 * 自动补全Markdown语法
 * @param {String} text 输入的文本
 * @param {String} type 要补全的类型
 * @return {String} 补全后的文本
 */
const autoComplete = function(text, type) {
  switch (type) {
    case 'bold':
      return text.startsWith('**') && text.endsWith('**') ? text : `**${text}**`;
    case 'italic':
      return text.startsWith('*') && text.endsWith('*') ? text : `*${text}*`;
    case 'code':
      return text.startsWith('`') && text.endsWith('`') ? text : `\`${text}\``;
    case 'link':
      return text.match(/\[.*\]\(.*\)/) ? text : `[${text}](url)`;
    default:
      return text;
  }
};

// 获取支持的语言列表
const getSupportedLanguages = function() {
  // 返回支持的语言数组
  return Object.keys(require('./highlight').languages || {});
};

module.exports = {
  markdownToHtml,
  getPlainText,
  countWords,
  autoComplete,
  getSupportedLanguages
};