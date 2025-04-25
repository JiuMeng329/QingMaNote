/**
 * highlight.js核心功能集成
 * 基于highlight.js-11.11.1版本
 */

// 定义支持的语言和对应的高亮规则
const languages = {
  // Java语言定义
  java: {
    name: 'java',
    keywords: {
      keyword: [
        'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 
        'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 
        'finally', 'float', 'for', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 
        'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 
        'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 
        'transient', 'try', 'void', 'volatile', 'while'
      ],
      literal: ['true', 'false', 'null'],
      type: [
        'String', 'Integer', 'Boolean', 'Character', 'Double', 'Float', 'Long', 
        'Object', 'Class', 'Throwable', 'Exception', 'Error'
      ],
      built_in: [
        'System', 'Math', 'Thread', 'Runnable', 'ArrayList', 'HashMap', 'LinkedList', 
        'HashSet', 'TreeMap', 'TreeSet', 'Map', 'List', 'Set', 'Collection'
      ]
    },
    contains: [
      {
        className: 'comment',
        begin: /\/\//,
        end: /$/
      },
      {
        className: 'comment',
        begin: /\/\*/,
        end: /\*\//,
        contains: ['self']
      },
      {
        className: 'string',
        begin: /"/,
        end: /"/,
        contains: [{ begin: /\\[\\"]/ }]
      },
      {
        className: 'number',
        variants: [
          { begin: /\b\d+[lL]?\b/ },
          { begin: /\b0x[\da-f]+\b/i },
          { begin: /\b\d+\.\d+[dDfF]?\b/ },
          { begin: /\b\d+[dDfF]\b/ }
        ]
      },
      {
        className: 'meta',
        begin: /@[a-z][a-z0-9_]*/i
      }
    ]
  },
  
  // JavaScript语言定义
  javascript: {
    name: 'javascript',
    aliases: ['js'],
    keywords: {
      keyword: [
        'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 
        'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 
        'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch', 
        'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
        'async', 'await', 'let'
      ],
      literal: ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'],
      built_in: [
        'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON', 
        'Promise', 'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol',
        'console', 'document', 'window'
      ]
    },
    contains: [
      {
        className: 'comment',
        begin: /\/\//,
        end: /$/
      },
      {
        className: 'comment',
        begin: /\/\*/,
        end: /\*\//
      },
      {
        className: 'string',
        begin: /"/,
        end: /"/,
        contains: [{ begin: /\\[\\"]/ }]
      },
      {
        className: 'string',
        begin: /'/,
        end: /'/,
        contains: [{ begin: /\\[\\']/ }]
      },
      {
        className: 'string',
        begin: /`/,
        end: /`/,
        contains: [
          { begin: /\\[\\`]/ },
          { begin: /\${/, end: /}/ }
        ]
      },
      {
        className: 'number',
        variants: [
          { begin: /\b\d+\b/ },
          { begin: /\b0x[\da-f]+\b/i },
          { begin: /\b\d+\.\d+\b/ }
        ]
      },
      {
        className: 'function',
        beginKeywords: 'function',
        end: /\{/,
        contains: [
          {
            className: 'title',
            begin: /[A-Za-z$_][0-9A-Za-z$_]*/
          }
        ]
      }
    ]
  },
  
  // Python语言定义
  python: {
    name: 'python',
    aliases: ['py'],
    keywords: {
      keyword: [
        'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 
        'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 
        'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 
        'raise', 'return', 'try', 'while', 'with', 'yield'
      ],
      literal: ['True', 'False', 'None'],
      built_in: [
        'abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'chr', 'classmethod', 
        'dict', 'dir', 'divmod', 'enumerate', 'eval', 'filter', 'float', 'format', 
        'frozenset', 'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id', 
        'input', 'int', 'isinstance', 'issubclass', 'iter', 'len', 'list', 'locals', 
        'map', 'max', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print', 
        'property', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice', 
        'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip'
      ]
    },
    contains: [
      {
        className: 'comment',
        begin: /#/,
        end: /$/
      },
      {
        className: 'string',
        variants: [
          { begin: /'/, end: /'/ },
          { begin: /"/, end: /"/ },
          { begin: /'''/, end: /'''/ },
          { begin: /"""/, end: /"""/ }
        ]
      },
      {
        className: 'number',
        variants: [
          { begin: /\b\d+\b/ },
          { begin: /\b0x[\da-f]+\b/i },
          { begin: /\b\d+\.\d+\b/ }
        ]
      },
      {
        className: 'function',
        beginKeywords: 'def',
        end: /:/,
        contains: [
          {
            className: 'title',
            begin: /[A-Za-z_][A-Za-z0-9_]*/
          }
        ]
      },
      {
        className: 'class',
        beginKeywords: 'class',
        end: /:/,
        contains: [
          {
            className: 'title',
            begin: /[A-Za-z_][A-Za-z0-9_]*/
          }
        ]
      }
    ]
  },
  
  // C/C++语言定义
  cpp: {
    name: 'cpp',
    aliases: ['c', 'cc', 'h', 'c++', 'h++'],
    keywords: {
      keyword: [
        'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'delete', 
        'do', 'else', 'enum', 'explicit', 'export', 'extern', 'for', 'friend', 
        'goto', 'if', 'inline', 'mutable', 'namespace', 'new', 'operator', 'private', 
        'protected', 'public', 'register', 'return', 'sizeof', 'static', 'struct', 
        'switch', 'template', 'this', 'throw', 'try', 'typedef', 'typeid', 'typename', 
        'union', 'using', 'virtual', 'volatile', 'while'
      ],
      type: [
        'auto', 'bool', 'char', 'double', 'float', 'int', 'long', 'short', 
        'signed', 'unsigned', 'void'
      ],
      literal: ['true', 'false', 'nullptr', 'NULL']
    },
    contains: [
      {
        className: 'comment',
        begin: /\/\//,
        end: /$/
      },
      {
        className: 'comment',
        begin: /\/\*/,
        end: /\*\//
      },
      {
        className: 'string',
        begin: /"/,
        end: /"/,
        contains: [{ begin: /\\[\\"]/ }]
      },
      {
        className: 'string',
        begin: /'/,
        end: /'/,
        contains: [{ begin: /\\[\\']/ }]
      },
      {
        className: 'number',
        variants: [
          { begin: /\b\d+\b/ },
          { begin: /\b0x[\da-f]+\b/i },
          { begin: /\b\d+\.\d+\b/ }
        ]
      }
    ]
  },
  
  // SQL语言定义
  sql: {
    name: 'sql',
    keywords: {
      keyword: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 
        'TABLE', 'DATABASE', 'VIEW', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 
        'FULL', 'GROUP', 'ORDER', 'BY', 'HAVING', 'AS', 'IN', 'EXISTS', 'BETWEEN', 
        'LIKE', 'IS', 'NULL', 'NOT', 'AND', 'OR', 'DISTINCT', 'UNION', 'ALL'
      ],
      literal: ['NULL', 'TRUE', 'FALSE'],
      built_in: [
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'CASE', 'WHEN', 'THEN', 'ELSE', 
        'END', 'CAST', 'CONVERT', 'DATEADD', 'DATEDIFF', 'FORMAT', 'ISNULL'
      ]
    },
    contains: [
      {
        className: 'comment',
        begin: /--/,
        end: /$/
      },
      {
        className: 'comment',
        begin: /\/\*/,
        end: /\*\//
      },
      {
        className: 'string',
        begin: /'/,
        end: /'/,
        contains: [{ begin: /''/}]
      },
      {
        className: 'string',
        begin: /"/,
        end: /"/,
        contains: [{ begin: /""/}]
      },
      {
        className: 'number',
        begin: /\b\d+\b/
      }
    ]
  },
  
  // 添加更多语言...
};

// 主题样式
const themes = {
  light: {
    'keyword': '#8959a8',
    'title': '#4271ae',
    'built_in': '#4271ae',
    'literal': '#f5871f',
    'string': '#718c00',
    'number': '#f5871f',
    'comment': '#8e908c',
    'function': '#4271ae',
    'tag': '#c82829',
    'attribute': '#f5871f',
    'background': '#fafafa',
    'text': '#333333',
    'border': '#eaeaea'
  },
  dark: {
    'keyword': '#c792ea',
    'title': '#82aaff',
    'built_in': '#82aaff',
    'literal': '#f78c6c',
    'string': '#c3e88d',
    'number': '#f78c6c',
    'comment': '#676e95',
    'function': '#82aaff',
    'tag': '#f07178',
    'attribute': '#ffcb6b',
    'background': '#292d3e',
    'text': '#d4d4d4',
    'border': '#434758'
  },
  github: {
    'keyword': '#cf222e',
    'title': '#0550ae',
    'built_in': '#0550ae',
    'literal': '#0550ae',
    'string': '#0a3069',
    'number': '#0550ae',
    'comment': '#6e7781',
    'function': '#0550ae',
    'tag': '#116329',
    'attribute': '#953800',
    'background': '#f6f8fa',
    'text': '#24292f',
    'border': '#d0d7de'
  }
};

// 当前主题
let currentTheme = 'light';

// 匹配规则帮助函数
function matchBlock(text, rule) {
  if (!rule.begin) return null;
  
  const beginMatch = text.match(rule.begin);
  if (!beginMatch) return null;
  
  const startIndex = beginMatch.index;
  const matchedText = beginMatch[0];
  
  // 如果有结束标记，查找匹配的结束
  if (rule.end) {
    const searchText = text.substring(startIndex + matchedText.length);
    const endMatch = searchText.match(rule.end);
    
    if (endMatch) {
      const blockContent = text.substring(
        startIndex, 
        startIndex + matchedText.length + endMatch.index + endMatch[0].length
      );
      return {
        text: blockContent,
        offset: startIndex,
        length: blockContent.length,
        className: rule.className
      };
    }
  }
  
  return {
    text: matchedText,
    offset: startIndex,
    length: matchedText.length,
    className: rule.className
  };
}

// 解析代码
function parse(code, language) {
  if (!language || !languages[language]) {
    return autoDetectLanguage(code);
  }
  
  const langDef = languages[language];
  let result = code;
  const tokens = [];
  
  // 处理各种语法元素
  // 1. 注释、字符串等
  if (langDef.contains) {
    langDef.contains.forEach(rule => {
      let textToProcess = code;
      let currentOffset = 0;
      
      while (textToProcess.length > 0) {
        const match = matchBlock(textToProcess, rule);
        if (!match) break;
        
        const absoluteOffset = currentOffset + match.offset;
        tokens.push({
          className: match.className,
          text: match.text,
          startOffset: absoluteOffset,
          endOffset: absoluteOffset + match.length
        });
        
        // 更新处理位置
        const nextPosition = match.offset + match.length;
        textToProcess = textToProcess.substring(nextPosition);
        currentOffset += nextPosition;
      }
    });
  }
  
  // 2. 关键字
  if (langDef.keywords) {
    // 处理各种类型的关键字
    Object.keys(langDef.keywords).forEach(type => {
      const keywords = langDef.keywords[type];
      keywords.forEach(keyword => {
        // 使用单词边界确保完整匹配关键字
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        let match;
        while ((match = regex.exec(code)) !== null) {
          // 检查这个位置是否已经被其他标记覆盖
          let isOverlapping = false;
          for (const token of tokens) {
            if (match.index >= token.startOffset && match.index < token.endOffset) {
              isOverlapping = true;
              break;
            }
          }
          
          if (!isOverlapping) {
            tokens.push({
              className: type,
              text: match[0],
              startOffset: match.index,
              endOffset: match.index + match[0].length
            });
          }
        }
      });
    });
  }
  
  // 按照开始位置排序tokens
  tokens.sort((a, b) => a.startOffset - b.startOffset);
  
  // 应用高亮
  let highlightedCode = '';
  let currentPosition = 0;
  
  for (const token of tokens) {
    // 添加未高亮的部分
    if (token.startOffset > currentPosition) {
      highlightedCode += escapeHtml(code.substring(currentPosition, token.startOffset));
    }
    
    // 添加高亮的部分
    highlightedCode += `<span class="${token.className}">${escapeHtml(token.text)}</span>`;
    currentPosition = token.endOffset;
  }
  
  // 添加最后未高亮的部分
  if (currentPosition < code.length) {
    highlightedCode += escapeHtml(code.substring(currentPosition));
  }
  
  return highlightedCode;
}

// 自动检测语言
function autoDetectLanguage(code) {
  // 简单的语言检测逻辑，可以根据需要扩展
  if (code.includes('class') && code.includes('public') && code.includes(';')) {
    return parse(code, 'java');
  } else if (code.includes('def ') && code.includes(':')) {
    return parse(code, 'python');
  } else if (code.includes('function') && code.includes('{') && code.includes('}')) {
    return parse(code, 'javascript');
  } else if (code.includes('SELECT') && code.includes('FROM')) {
    return parse(code, 'sql');
  } else if (code.includes('#include') || code.includes('int main')) {
    return parse(code, 'cpp');
  }
  
  // 默认返回转义后的代码
  return escapeHtml(code);
}

// 高亮代码
function highlight(code, options) {
  options = options || {};
  const language = options.language || '';
  
  try {
    const highlightedCode = parse(code, language);
    return {
      value: highlightedCode,
      language: language
    };
  } catch (e) {
    console.error('Highlight error:', e);
    return {
      value: escapeHtml(code),
      language: language
    };
  }
}

// 自动高亮
function highlightAuto(code) {
  return {
    value: autoDetectLanguage(code),
    language: 'auto'
  };
}

// 转义HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 获取支持的语言
function getLanguage(lang) {
  return languages[lang] || null;
}

// 设置主题
function setTheme(theme) {
  if (themes[theme]) {
    currentTheme = theme;
  }
}

// 获取当前主题样式
function getCurrentThemeStyles() {
  return themes[currentTheme] || themes.light;
}

// 获取CSS样式
function getStyleSheet() {
  const theme = getCurrentThemeStyles();
  let css = '.hljs {';
  
  // 背景和文本颜色
  css += `background: ${theme.background};`;
  css += `color: ${theme.text};`;
  css += 'padding: 1em;';
  css += 'border-radius: 8px;';
  css += `border: 1px solid ${theme.border};`;
  css += '}';
  
  // 各种语法元素的样式
  Object.keys(theme).forEach(key => {
    if (key !== 'background' && key !== 'text' && key !== 'border') {
      css += `.hljs .${key} { color: ${theme[key]}; }`;
    }
  });
  
  return css;
}

// 导出模块
module.exports = {
  highlight,
  highlightAuto,
  escapeHtml,
  getLanguage,
  setTheme,
  getCurrentThemeStyles,
  getStyleSheet
}; 