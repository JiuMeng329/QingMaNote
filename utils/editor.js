// utils/editor.js

/**
 * 编辑器工具函数
 * 提供文本编辑、格式化、光标位置处理等功能
 */

/**
 * 在文本中插入Markdown标记
 * @param {String} content 原始内容
 * @param {Object} selection 选择范围，包含start和end属性
 * @param {String} prefix 前缀标记
 * @param {String} suffix 后缀标记
 * @return {String} 插入标记后的内容
 */
const insertMarkdown = function(content, selection, prefix, suffix) {
  if (!content) content = '';
  
  // 如果没有选择文本，则在光标位置插入
  if (selection.start === selection.end) {
    const before = content.substring(0, selection.start);
    const after = content.substring(selection.end);
    return before + prefix + suffix + after;
  }
  
  // 如果选择了文本，则在选择的文本前后插入标记
  const before = content.substring(0, selection.start);
  const selected = content.substring(selection.start, selection.end);
  const after = content.substring(selection.end);
  
  return before + prefix + selected + suffix + after;
};

/**
 * 在指定位置插入文本
 * @param {String} content 原始内容
 * @param {Number} position 插入位置
 * @param {String} text 要插入的文本
 * @return {Object} 包含新内容和新选择范围的对象
 */
const insertText = function(content, position, text) {
  if (!content) content = '';
  
  // 在指定位置插入文本
  const before = content.substring(0, position);
  const after = content.substring(position);
  const newContent = before + text + after;
  
  // 计算新的选择范围
  const newSelection = {
    start: position + text.length,
    end: position + text.length
  };
  
  return { newContent, selection: newSelection };
};

/**
 * 在多行文本中插入Markdown标记
 * 适用于列表、引用等需要在每行前面添加标记的情况
 * @param {String} content 原始内容
 * @param {Object} selection 选择范围，包含start和end属性
 * @param {String} linePrefix 行前缀标记
 * @return {String} 插入标记后的内容
 */
const insertLineMarkdown = function(content, selection, linePrefix) {
  if (!content) content = '';
  
  // 如果没有选择文本，则在当前行插入
  if (selection.start === selection.end) {
    // 找到当前行的开始位置
    let lineStart = selection.start;
    while (lineStart > 0 && content.charAt(lineStart - 1) !== '\n') {
      lineStart--;
    }
    
    const before = content.substring(0, lineStart);
    const line = content.substring(lineStart, selection.end);
    const after = content.substring(selection.end);
    
    return before + linePrefix + line + after;
  }
  
  // 如果选择了多行文本，则在每行前面插入标记
  const selectedText = content.substring(selection.start, selection.end);
  const lines = selectedText.split('\n');
  const markedLines = lines.map(line => linePrefix + line);
  const markedText = markedLines.join('\n');
  
  const before = content.substring(0, selection.start);
  const after = content.substring(selection.end);
  
  return before + markedText + after;
};

/**
 * 获取光标所在行的文本
 * @param {String} content 完整内容
 * @param {Number} cursorPosition 光标位置
 * @return {Object} 包含行文本和行起始位置的对象
 */
const getCurrentLine = function(content, cursorPosition) {
  if (!content) return { text: '', start: 0, end: 0 };
  
  // 找到当前行的开始位置
  let lineStart = cursorPosition;
  while (lineStart > 0 && content.charAt(lineStart - 1) !== '\n') {
    lineStart--;
  }
  
  // 找到当前行的结束位置
  let lineEnd = cursorPosition;
  while (lineEnd < content.length && content.charAt(lineEnd) !== '\n') {
    lineEnd++;
  }
  
  const lineText = content.substring(lineStart, lineEnd);
  
  return {
    text: lineText,
    start: lineStart,
    end: lineEnd
  };
};

/**
 * 在表格中添加一行
 * @param {String} content 原始内容
 * @param {Object} selection 选择范围，包含start和end属性
 * @return {String} 添加行后的内容
 */
const addTableRow = function(content, selection) {
  if (!content) return content;
  
  // 获取当前行
  const currentLine = getCurrentLine(content, selection.start);
  const lineText = currentLine.text;
  
  // 检查是否在表格中
  if (!lineText.startsWith('|') || !lineText.endsWith('|')) {
    return content;
  }
  
  // 计算列数
  const columns = lineText.split('|').length - 2; // 减去开头和结尾的分隔符
  
  // 创建新行
  let newRow = '|';
  for (let i = 0; i < columns; i++) {
    newRow += ' 内容 |';
  }
  
  // 在当前行后插入新行
  const before = content.substring(0, currentLine.end);
  const after = content.substring(currentLine.end);
  
  return before + '\n' + newRow + after;
};

/**
 * 创建表格
 * @param {Number} rows 行数
 * @param {Number} cols 列数
 * @return {String} 表格Markdown文本
 */
const createTable = function(rows = 3, cols = 3) {
  // 创建表头
  let table = '|';
  for (let i = 0; i < cols; i++) {
    table += ` 表头${i+1} |`;
  }
  table += '\n|';
  
  // 创建分隔行
  for (let i = 0; i < cols; i++) {
    table += ' --- |';
  }
  table += '\n';
  
  // 创建数据行
  for (let i = 0; i < rows - 1; i++) {
    table += '|';
    for (let j = 0; j < cols; j++) {
      table += ` 内容 |`;
    }
    if (i < rows - 2) table += '\n';
  }
  
  return table;
};

/**
 * 处理Tab键缩进
 * @param {String} content 原始内容
 * @param {Object} selection 选择范围，包含start和end属性
 * @param {Boolean} isShiftPressed 是否按下Shift键（用于反向缩进）
 * @return {Object} 包含新内容和新选择范围的对象
 */
const handleTabIndent = function(content, selection, isShiftPressed = false) {
  if (!content) return { content: '', selection: { start: 0, end: 0 } };
  
  // 获取当前行
  const currentLine = getCurrentLine(content, selection.start);
  
  if (isShiftPressed) {
    // 反向缩进（减少缩进）
    if (currentLine.text.startsWith('\t')) {
      // 移除制表符
      const newContent = content.substring(0, currentLine.start) + 
                        currentLine.text.substring(1) + 
                        content.substring(currentLine.end);
      
      // 调整选择范围
      const newSelection = {
        start: Math.max(selection.start - 1, currentLine.start),
        end: Math.max(selection.end - 1, currentLine.start)
      };
      
      return { content: newContent, selection: newSelection };
    } else if (currentLine.text.startsWith('    ')) {
      // 移除4个空格
      const newContent = content.substring(0, currentLine.start) + 
                        currentLine.text.substring(4) + 
                        content.substring(currentLine.end);
      
      // 调整选择范围
      const newSelection = {
        start: Math.max(selection.start - 4, currentLine.start),
        end: Math.max(selection.end - 4, currentLine.start)
      };
      
      return { content: newContent, selection: newSelection };
    }
  } else {
    // 正向缩进（增加缩进）
    const newContent = content.substring(0, currentLine.start) + 
                      '    ' + currentLine.text + 
                      content.substring(currentLine.end);
    
    // 调整选择范围
    const newSelection = {
      start: selection.start + 4,
      end: selection.end + 4
    };
    
    return { content: newContent, selection: newSelection };
  }
  
  return { content, selection };
};

/**
 * 处理回车键换行
 * @param {String} content 原始内容
 * @param {Object} selection 选择范围，包含start和end属性
 * @return {Object} 包含新内容和新选择范围的对象
 */
const handleEnterKey = function(content, selection) {
  if (!content) return { content: '\n', selection: { start: 1, end: 1 } };
  
  // 获取当前行
  const currentLine = getCurrentLine(content, selection.start);
  const lineText = currentLine.text;
  
  // 检查是否在列表项中
  const listMatch = lineText.match(/^(\s*)([-*+]|\d+\.)\s(.*)$/);
  if (listMatch) {
    const [, indent, marker, itemText] = listMatch;
    
    // 如果列表项内容为空，则结束列表
    if (!itemText.trim()) {
      const newContent = content.substring(0, currentLine.start) + 
                        content.substring(currentLine.end);
      return { 
        content: newContent, 
        selection: { start: currentLine.start, end: currentLine.start } 
      };
    }
    
    // 创建新的列表项
    let newMarker = marker;
    if (marker.match(/\d+\./)) {
      // 对于有序列表，增加编号
      const num = parseInt(marker);
      newMarker = `${num + 1}.`;
    }
    
    const newLine = `\n${indent}${newMarker} `;
    const newContent = content.substring(0, selection.start) + 
                      newLine + 
                      content.substring(selection.end);
    
    return { 
      content: newContent, 
      selection: { 
        start: selection.start + newLine.length, 
        end: selection.start + newLine.length 
      } 
    };
  }
  
  // 检查是否在引用中
  if (lineText.match(/^\s*>\s/)) {
    const newLine = '\n> ';
    const newContent = content.substring(0, selection.start) + 
                      newLine + 
                      content.substring(selection.end);
    
    return { 
      content: newContent, 
      selection: { 
        start: selection.start + newLine.length, 
        end: selection.start + newLine.length 
      } 
    };
  }
  
  // 检查是否在代码块中
  if (content.substring(0, selection.start).includes('```') && 
      !content.substring(0, selection.start).split('```').slice(-1)[0].includes('```')) {
    const newLine = '\n';
    const newContent = content.substring(0, selection.start) + 
                      newLine + 
                      content.substring(selection.end);
    
    return { 
      content: newContent, 
      selection: { 
        start: selection.start + newLine.length, 
        end: selection.start + newLine.length 
      } 
    };
  }
  
  // 默认处理
  const newContent = content.substring(0, selection.start) + 
                    '\n' + 
                    content.substring(selection.end);
  
  return { 
    content: newContent, 
    selection: { 
      start: selection.start + 1, 
      end: selection.start + 1 
    } 
  };
};

/**
 * 插入Markdown语法
 * 根据不同类型调用insertMarkdown或insertLineMarkdown函数
 * @param {String} content 原始内容
 * @param {Object} selection 选择范围，包含start和end属性
 * @param {String} type 要插入的Markdown类型
 * @return {Object} 包含新内容和新选择范围的对象
 */
const insertMarkdownSyntax = function(content, selection, type) {
  let newContent = content;
  let newSelection = { ...selection };
  
  // 获取选中内容
  const selectedText = content.substring(selection.start, selection.end);
  
  switch (type) {
    case 'h1':
      // 检查当前行是否已有标题格式
      const h1Line = getCurrentLine(content, selection.start);
      if (h1Line.text.startsWith('# ')) {
        // 如果已有，则移除标题格式
        const beforeLine = content.substring(0, h1Line.start);
        const afterLine = content.substring(h1Line.end);
        const cleanedLine = h1Line.text.substring(2);
        newContent = beforeLine + cleanedLine + afterLine;
        newSelection = {
          start: selection.start - 2 > h1Line.start ? selection.start - 2 : h1Line.start,
          end: selection.end - 2 > h1Line.start ? selection.end - 2 : h1Line.start + cleanedLine.length
        };
      } else {
        newContent = insertLineMarkdown(content, selection, '# ');
        newSelection = {
          start: selection.start === selection.end ? selection.start + 2 : selection.start + 2,
          end: selection.end + 2
        };
      }
      break;
    case 'h2':
      // 检查当前行是否已有标题格式
      const h2Line = getCurrentLine(content, selection.start);
      if (h2Line.text.startsWith('## ')) {
        // 如果已有，则移除标题格式
        const beforeLine = content.substring(0, h2Line.start);
        const afterLine = content.substring(h2Line.end);
        const cleanedLine = h2Line.text.substring(3);
        newContent = beforeLine + cleanedLine + afterLine;
        newSelection = {
          start: selection.start - 3 > h2Line.start ? selection.start - 3 : h2Line.start,
          end: selection.end - 3 > h2Line.start ? selection.end - 3 : h2Line.start + cleanedLine.length
        };
      } else {
        newContent = insertLineMarkdown(content, selection, '## ');
        newSelection = {
          start: selection.start === selection.end ? selection.start + 3 : selection.start + 3,
          end: selection.end + 3
        };
      }
      break;
    case 'h3':
      // 类似h1和h2的逻辑
      const h3Line = getCurrentLine(content, selection.start);
      if (h3Line.text.startsWith('### ')) {
        const beforeLine = content.substring(0, h3Line.start);
        const afterLine = content.substring(h3Line.end);
        const cleanedLine = h3Line.text.substring(4);
        newContent = beforeLine + cleanedLine + afterLine;
        newSelection = {
          start: selection.start - 4 > h3Line.start ? selection.start - 4 : h3Line.start,
          end: selection.end - 4 > h3Line.start ? selection.end - 4 : h3Line.start + cleanedLine.length
        };
      } else {
        newContent = insertLineMarkdown(content, selection, '### ');
        newSelection = {
          start: selection.start === selection.end ? selection.start + 4 : selection.start + 4,
          end: selection.end + 4
        };
      }
      break;
    case 'bold':
      // 检查选中内容是否已是粗体
      if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
        // 如果已是粗体，则移除粗体格式
        const innerText = selectedText.substring(2, selectedText.length - 2);
        newContent = content.substring(0, selection.start) + innerText + content.substring(selection.end);
        newSelection = {
          start: selection.start,
          end: selection.start + innerText.length
        };
      } else {
        newContent = insertMarkdown(content, selection, '**', '**');
        newSelection = {
          start: selection.start === selection.end ? selection.start + 2 : selection.start,
          end: selection.start === selection.end ? selection.start + 2 : selection.end + 4
        };
      }
      break;
    case 'italic':
      // 检查选中内容是否已是斜体
      if (selectedText.startsWith('*') && selectedText.endsWith('*')) {
        // 如果已是斜体，则移除斜体格式
        const innerText = selectedText.substring(1, selectedText.length - 1);
        newContent = content.substring(0, selection.start) + innerText + content.substring(selection.end);
        newSelection = {
          start: selection.start,
          end: selection.start + innerText.length
        };
      } else {
        newContent = insertMarkdown(content, selection, '*', '*');
        newSelection = {
          start: selection.start === selection.end ? selection.start + 1 : selection.start,
          end: selection.start === selection.end ? selection.start + 1 : selection.end + 2
        };
      }
      break;
    case 'strikethrough':
      // 检查选中内容是否已有删除线
      if (selectedText.startsWith('~~') && selectedText.endsWith('~~')) {
        // 如果已有删除线，则移除格式
        const innerText = selectedText.substring(2, selectedText.length - 2);
        newContent = content.substring(0, selection.start) + innerText + content.substring(selection.end);
        newSelection = {
          start: selection.start,
          end: selection.start + innerText.length
        };
      } else {
        newContent = insertMarkdown(content, selection, '~~', '~~');
        newSelection = {
          start: selection.start === selection.end ? selection.start + 2 : selection.start,
          end: selection.start === selection.end ? selection.start + 2 : selection.end + 4
        };
      }
      break;
    case 'code':
      // 检查选中内容是否已是行内代码
      if (selectedText.startsWith('`') && selectedText.endsWith('`')) {
        // 如果已是行内代码，则移除格式
        const innerText = selectedText.substring(1, selectedText.length - 1);
        newContent = content.substring(0, selection.start) + innerText + content.substring(selection.end);
        newSelection = {
          start: selection.start,
          end: selection.start + innerText.length
        };
      } else {
        newContent = insertMarkdown(content, selection, '`', '`');
        newSelection = {
          start: selection.start === selection.end ? selection.start + 1 : selection.start,
          end: selection.start === selection.end ? selection.start + 1 : selection.end + 2
        };
      }
      break;
    case 'codeblock':
      // 检查是否已在代码块中
      const codeblockRegex = /```[\s\S]*?```/g;
      const selectedRange = content.substring(
        Math.max(0, selection.start - 10),
        Math.min(content.length, selection.end + 10)
      );
      
      if (selectedRange.match(codeblockRegex)) {
        // 如果已在代码块中，复杂情况，简单处理为添加新代码块
        newContent = insertMarkdown(content, selection, '```\n', '\n```');
      } else {
        // 添加代码块并添加语言提示
        newContent = insertMarkdown(content, selection, '```\n', '\n```');
      }
      newSelection = {
        start: selection.start === selection.end ? selection.start + 4 : selection.start + 4,
        end: selection.end + 4
      };
      break;
    case 'link':
      // 检查是否已是链接
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
      if (selectedText.match(linkRegex)) {
        // 已是链接，提取文本
        const matches = selectedText.match(linkRegex);
        newContent = content.substring(0, selection.start) + matches[1] + content.substring(selection.end);
        newSelection = {
          start: selection.start,
          end: selection.start + matches[1].length
        };
      } else {
        // 检查选中内容是否像URL
        const urlRegex = /^(https?:\/\/|www\.)[^\s]+$/;
        if (selectedText.match(urlRegex)) {
          // 如果是URL，将其转为 [URL](URL) 格式
          newContent = content.substring(0, selection.start) + 
                      `[${selectedText}](${selectedText})` + 
                      content.substring(selection.end);
          newSelection = {
            start: selection.start + 1,
            end: selection.start + selectedText.length + 1
          };
        } else if (selectedText) {
          // 有选中文本但不是URL
          newContent = content.substring(0, selection.start) + 
                      `[${selectedText}](url)` + 
                      content.substring(selection.end);
          newSelection = {
            start: selection.end + 3,
            end: selection.end + 6
          };
        } else {
          // 无选中文本
          newContent = insertMarkdown(content, selection, '[链接文字](', ')');
          newSelection = {
            start: selection.start + 1,
            end: selection.start + 5
          };
        }
      }
      break;
    case 'quote':
      // 引用格式，检查当前行是否已有引用
      const quoteLine = getCurrentLine(content, selection.start);
      if (quoteLine.text.startsWith('> ')) {
        // 如果已有引用，则移除
        const beforeLine = content.substring(0, quoteLine.start);
        const afterLine = content.substring(quoteLine.end);
        const cleanedLine = quoteLine.text.substring(2);
        newContent = beforeLine + cleanedLine + afterLine;
        newSelection = {
          start: selection.start - 2 > quoteLine.start ? selection.start - 2 : quoteLine.start,
          end: selection.end - 2 > quoteLine.start ? selection.end - 2 : quoteLine.start + cleanedLine.length
        };
      } else {
        newContent = insertLineMarkdown(content, selection, '> ');
        newSelection = {
          start: selection.start === selection.end ? selection.start + 2 : selection.start + 2,
          end: selection.end + 2
        };
      }
      break;
    case 'list-ul':
      // 无序列表，检查当前行是否已有列表
      const ulLine = getCurrentLine(content, selection.start);
      if (ulLine.text.match(/^[\s]*[-*+]\s/)) {
        // 如果已有无序列表，则移除
        const listMatch = ulLine.text.match(/^([\s]*)[-*+]\s(.*)$/);
        if (listMatch) {
          const indent = listMatch[1];
          const itemText = listMatch[2];
          const beforeLine = content.substring(0, ulLine.start);
          const afterLine = content.substring(ulLine.end);
          const cleanedLine = indent + itemText;
          newContent = beforeLine + cleanedLine + afterLine;
          newSelection = {
            start: selection.start - 2 > ulLine.start ? selection.start - 2 : ulLine.start + indent.length,
            end: selection.end - 2 > ulLine.start ? selection.end - 2 : ulLine.start + cleanedLine.length
          };
        } else {
          // 格式不匹配，添加新列表项
          newContent = insertLineMarkdown(content, selection, '- ');
        }
      } else {
        newContent = insertLineMarkdown(content, selection, '- ');
        newSelection = {
          start: selection.start === selection.end ? selection.start + 2 : selection.start + 2,
          end: selection.end + 2
        };
      }
      break;
    case 'list-ol':
      // 有序列表，检查当前行是否已有列表
      const olLine = getCurrentLine(content, selection.start);
      if (olLine.text.match(/^[\s]*\d+\.\s/)) {
        // 如果已有有序列表，则移除
        const listMatch = olLine.text.match(/^([\s]*)\d+\.\s(.*)$/);
        if (listMatch) {
          const indent = listMatch[1];
          const itemText = listMatch[2];
          const beforeLine = content.substring(0, olLine.start);
          const afterLine = content.substring(olLine.end);
          const cleanedLine = indent + itemText;
          newContent = beforeLine + cleanedLine + afterLine;
          newSelection = {
            start: selection.start - 3 > olLine.start ? selection.start - 3 : olLine.start + indent.length,
            end: selection.end - 3 > olLine.start ? selection.end - 3 : olLine.start + cleanedLine.length
          };
        } else {
          // 格式不匹配，添加新列表项
          newContent = insertLineMarkdown(content, selection, '1. ');
        }
      } else {
        newContent = insertLineMarkdown(content, selection, '1. ');
        newSelection = {
          start: selection.start === selection.end ? selection.start + 3 : selection.start + 3,
          end: selection.end + 3
        };
      }
      break;
    case 'horizontalRule':
      if (selection.start > 0 && content.charAt(selection.start - 1) !== '\n') {
        newContent = insertMarkdown(content, selection, '\n---\n', '');
        newSelection = {
          start: selection.end + 5,
          end: selection.end + 5
        };
      } else {
        newContent = insertMarkdown(content, selection, '---\n', '');
        newSelection = {
          start: selection.end + 4,
          end: selection.end + 4
        };
      }
      break;
    case 'table':
      // 创建表格
      const table = createTable(3, 3);
      if (selection.start > 0 && content.charAt(selection.start - 1) !== '\n') {
        newContent = content.substring(0, selection.start) + '\n' + table + content.substring(selection.end);
        newSelection = {
          start: selection.start + 2,
          end: selection.start + 2
        };
      } else {
        newContent = content.substring(0, selection.start) + table + content.substring(selection.end);
        newSelection = {
          start: selection.start + 1,
          end: selection.start + 1
        };
      }
      break;
    case 'image':
      // 图片插入会在外部处理，这里只是为了逻辑完整
      if (selectedText) {
        // 如果有选中文本，则用作图片描述
        newContent = content.substring(0, selection.start) + 
                    `![${selectedText}](image_url)` + 
                    content.substring(selection.end);
        newSelection = {
          start: selection.end + 2,
          end: selection.end + 11
        };
      } else {
        newContent = insertMarkdown(content, selection, '![图片描述](', ')');
        newSelection = {
          start: selection.start + 2,
          end: selection.start + 6
        };
      }
      break;
    case 'task':
      // 任务列表
      const taskLine = getCurrentLine(content, selection.start);
      if (taskLine.text.match(/^[\s]*- \[ \]\s/) || taskLine.text.match(/^[\s]*- \[x\]\s/)) {
        // 如果已是任务列表，则移除
        const taskMatch = taskLine.text.match(/^([\s]*)- \[[x ]\]\s(.*)$/);
        if (taskMatch) {
          const indent = taskMatch[1];
          const itemText = taskMatch[2];
          const beforeLine = content.substring(0, taskLine.start);
          const afterLine = content.substring(taskLine.end);
          const cleanedLine = indent + itemText;
          newContent = beforeLine + cleanedLine + afterLine;
          newSelection = {
            start: selection.start - 6 > taskLine.start ? selection.start - 6 : taskLine.start + indent.length,
            end: selection.end - 6 > taskLine.start ? selection.end - 6 : taskLine.start + cleanedLine.length
          };
        } else {
          newContent = insertLineMarkdown(content, selection, '- [ ] ');
        }
      } else {
        newContent = insertLineMarkdown(content, selection, '- [ ] ');
        newSelection = {
          start: selection.start === selection.end ? selection.start + 6 : selection.start + 6,
          end: selection.end + 6
        };
      }
      break;
    default:
      // 默认不做任何处理
      break;
  }
  
  return { newContent, selection: newSelection };
};

module.exports = {
  insertMarkdown,
  insertLineMarkdown,
  getCurrentLine,
  addTableRow,
  createTable,
  handleTabIndent,
  handleEnterKey,
  insertMarkdownSyntax,
  insertText
};