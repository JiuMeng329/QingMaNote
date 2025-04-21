/*这个文件包含了以下主要功能：
基础词典 (BASE_DICTIONARY): 一个包含常用英文单词的集合，可以根据需要扩展。
Markdown 标记过滤 (extractPlainText): 用于从 Markdown 文本中提取纯文本内容，避免对代码块、链接等进行检查。
分词 (tokenize): 将纯文本分割成单词列表。
核心拼写检查 (checkSpelling): 对比单词列表和词典（基础词典 + 用户自定义词典），找出未识别的单词。
拼写检查器实例创建 (createSpellChecker):
管理用户自定义词典。
使用 debounce 函数防止过于频繁的检查。
尝试使用微信小程序的 Worker (workers/spellCheck.js) 来执行检查，以避免阻塞主线程。
如果 Worker 不可用或创建失败，则降级到在主线程中进行检查。
提供 check 方法来触发检查，并通过回调函数返回错误单词列表。
提供 addWords 方法来向用户自定义词典中添加单词。 */

// 本地基础词典 - 可根据需要扩展
const BASE_DICTIONARY = new Set([
  // 基础代词和冠词
  'a', 'an', 'the', 'i', 'my', 'mine', 'me', 'you', 'your', 'yours', 'he', 'him', 'his', 
  'she', 'her', 'hers', 'we', 'us', 'our', 'ours', 'they', 'them', 'their', 'theirs',
  
  // 常用动词
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'can', 'could', 'will', 'would', 'should', 'may', 'might', 'must',
  'go', 'goes', 'went', 'gone', 'going', 'come', 'comes', 'came', 'coming',
  'get', 'gets', 'got', 'gotten', 'getting', 'make', 'makes', 'made', 'making',
  'say', 'says', 'said', 'saying', 'know', 'knows', 'knew', 'known', 'knowing',
  'take', 'takes', 'took', 'taken', 'taking', 'see', 'sees', 'saw', 'seen', 'seeing',
  'use', 'uses', 'used', 'using', 'find', 'finds', 'found', 'finding',
  'give', 'gives', 'gave', 'given', 'giving', 'tell', 'tells', 'told', 'telling',
  
  // 常用介词和连词
  'to', 'for', 'from', 'of', 'on', 'in', 'at', 'by', 'with', 'about', 'as',
  'into', 'during', 'until', 'before', 'after', 'above', 'below', 'since',
  'and', 'or', 'but', 'if', 'though', 'because', 'although', 'when', 'while',
  
  // 常用形容词和副词
  'good', 'better', 'best', 'bad', 'worse', 'worst', 
  'big', 'small', 'high', 'low', 'long', 'short', 'old', 'new', 'young',
  'first', 'last', 'very', 'much', 'many', 'some', 'any', 'all', 'most',
  'more', 'less', 'only', 'just', 'too', 'enough', 'really', 'quite',
  
  // 编程相关词汇
  'markdown', 'editor', 'spell', 'check', 'code', 'block', 'function', 'variable',
  'javascript', 'typescript', 'html', 'css', 'react', 'vue', 'angular', 'node',
  'api', 'data', 'server', 'client', 'database', 'query', 'request', 'response',
  'component', 'module', 'interface', 'class', 'method', 'property', 'object',
  'array', 'string', 'number', 'boolean', 'null', 'undefined', 'async', 'await',
  'promise', 'callback', 'parameter', 'argument', 'return', 'export', 'import',
  
  // 微信小程序相关词汇
  'mini', 'program', 'wechat', 'wx', 'weixin', 'applet', 'page', 'component',
  'setData', 'app', 'json', 'wxml', 'wxss'
]);

// 特殊标记正则表达式
const MARKDOWN_REGEX = {
  CODE_BLOCK: /```[\s\S]*?```/g,
  INLINE_CODE: /`[^`]+`/g,
  LINK_IMAGE: /!?\[.*?\]\(.*?\)/g,
  HEADER: /^#+\s+/gm,
  BOLD_ITALIC: /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g,
  HTML_TAG: /<[^>]+>/g
};

// 提取纯文本（过滤Markdown标记）
function extractPlainText(markdown) {
  if (!markdown) return '';
  return markdown
    .replace(MARKDOWN_REGEX.CODE_BLOCK, ' ')    // 移除代码块
    .replace(MARKDOWN_REGEX.INLINE_CODE, ' ')   // 移除行内代码
    .replace(MARKDOWN_REGEX.LINK_IMAGE, ' ')    // 移除链接和图片
    .replace(MARKDOWN_REGEX.HEADER, ' ')        // 移除标题标记
    .replace(MARKDOWN_REGEX.BOLD_ITALIC, '$2$4') // 移除粗体/斜体标记
    .replace(MARKDOWN_REGEX.HTML_TAG, ' ');     // 移除HTML标签
}

// 分词函数（处理英文）
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^\w'-]+/)  // 按非单词字符分割
    .filter(word => word && word.length > 1); // 过滤空和单字符"单词"
}

// 计算编辑距离（Levenshtein距离）
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(a.length + 1).fill().map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // 删除
        matrix[i][j - 1] + 1,       // 插入
        matrix[i - 1][j - 1] + cost // 替换
      );
    }
  }
  return matrix[a.length][b.length];
}

// 获取拼写建议
function getSuggestions(word, dictionary, maxSuggestions = 3) {
  if (!word) return [];
  
  // 将字典转换为数组
  const dictArray = Array.from(dictionary);
  
  // 计算每个字典单词与目标单词的编辑距离
  const suggestions = dictArray
    .map(dictWord => ({
      word: dictWord,
      distance: levenshteinDistance(word.toLowerCase(), dictWord.toLowerCase())
    }))
    // 过滤掉编辑距离过大的单词（距离超过单词长度的一半）
    .filter(item => item.distance <= Math.max(2, Math.ceil(word.length / 2)))
    // 按照编辑距离排序
    .sort((a, b) => a.distance - b.distance)
    // 取前几个
    .slice(0, maxSuggestions)
    .map(item => item.word);
  
  return suggestions;
}

// 基础拼写检查
function checkSpelling(text, customDict = new Set()) {
  const plainText = extractPlainText(text);
  const words = tokenize(plainText);
  const combinedDict = new Set([...BASE_DICTIONARY, ...customDict]);
  
  const errors = [];
  const processedWords = new Set(); // 避免重复处理同一单词
  
  for (const word of words) {
    if (!combinedDict.has(word) && !processedWords.has(word)) {
      processedWords.add(word);
      
      // 获取拼写建议
      const suggestions = getSuggestions(word, combinedDict);
      
      errors.push({
        word,
        suggestions
      });
    }
  }
  
  return errors;
}

// 带缓存和防抖的检查
export function createSpellChecker(customDict = []) {
  const dictSet = new Set(customDict.map(w => w.toLowerCase()));
  let lastText = null;
  let lastResult = [];
  let checkInProgress = false;
  
  const check = debounce(function(text, callback) {
    if (checkInProgress) return; // 如果已经在检查，则忽略本次请求
    if (text === lastText) {
      callback(lastResult);
      return;
    }
    
    checkInProgress = true;
    // 使用小程序Worker提高性能
    if (typeof wx !== 'undefined' && wx.createWorker) {
      try {
        const worker = wx.createWorker('workers/spellCheck.js');
        worker.postMessage({
          text,
          customDict: Array.from(dictSet)
        });
        worker.onMessage(res => {
          lastText = text;
          lastResult = res.errors;
          callback(res.errors);
          worker.terminate();
          checkInProgress = false;
        });
        worker.onError(err => {
          console.error('拼写检查 Worker 错误:', err);
          // 降级处理
          const errors = checkSpelling(text, dictSet);
          lastText = text;
          lastResult = errors;
          callback(errors);
          checkInProgress = false;
        });
      } catch (e) {
        console.error('创建 Worker 失败:', e);
         // Worker 创建失败的降级处理
        const errors = checkSpelling(text, dictSet);
        lastText = text;
        lastResult = errors;
        callback(errors);
        checkInProgress = false;
      }
    } else {
      // 降级方案（例如，在非微信环境或不支持 Worker 的情况下）
      console.warn('Worker 不可用，使用主线程进行拼写检查');
      const errors = checkSpelling(text, dictSet);
      lastText = text;
      lastResult = errors;
      callback(errors);
      checkInProgress = false;
    }
  }, 500); // 500ms 防抖

  return {
    check: check,
    addWords: function(words) {
      if (!Array.isArray(words)) return;
      words.forEach(word => dictSet.add(String(word).toLowerCase()));
      // 清除缓存，因为词典已更新
      lastText = null; 
      lastResult = [];
    }
  };
}

// 防抖函数
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
} 