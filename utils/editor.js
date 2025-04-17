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

module.exports = {
  insertMarkdown,
  insertLineMarkdown,
  getCurrentLine,
  addTableRow,
  createTable,
  handleTabIndent,
  handleEnterKey
};