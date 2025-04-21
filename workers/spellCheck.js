// workers/spellCheck.js

/*这个 Worker 文件主要做了以下几件事：
复制核心逻辑: 它包含了与 utils/spellCheck.js 中相同的核心函数，如 BASE_DICTIONARY, MARKDOWN_REGEX, extractPlainText, tokenize, 和 checkSpelling。 注意: 在实际项目中，最好考虑代码复用，避免这样直接复制。但对于 Worker 来说，有时这是最直接的方法。
监听消息 (worker.onMessage): 等待主线程发送包含 text 和 customDict 的消息。
执行检查: 收到消息后，调用 checkSpelling 函数进行拼写检查。
发送结果 (worker.postMessage): 将检查出的错误单词列表 (errors) 发送回主线程。
日志记录: 在 Worker 内部添加了 console.log 和 console.error，方便调试。*/


// 本地基础词典 - 需要与主线程 utils/spellCheck.js 保持一致或通过消息传递
// 为了简单起见，这里重新定义，但在实际应用中，考虑代码复用或传递
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

// 特殊标记正则表达式 - 同上，应与主线程保持一致
const MARKDOWN_REGEX = {
  CODE_BLOCK: /```[\s\S]*?```/g,
  INLINE_CODE: /`[^`]+`/g,
  LINK_IMAGE: /!?\[.*?\]\(.*?\)/g,
  HEADER: /^#+\s+/gm,
  BOLD_ITALIC: /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g,
  HTML_TAG: /<[^>]+>/g
};

// 提取纯文本（过滤Markdown标记） - 同上
function extractPlainText(markdown) {
    if (!markdown) return '';
    return markdown
      .replace(MARKDOWN_REGEX.CODE_BLOCK, ' ')
      .replace(MARKDOWN_REGEX.INLINE_CODE, ' ')
      .replace(MARKDOWN_REGEX.LINK_IMAGE, ' ')
      .replace(MARKDOWN_REGEX.HEADER, ' ')
      .replace(MARKDOWN_REGEX.BOLD_ITALIC, '$2$4')
      .replace(MARKDOWN_REGEX.HTML_TAG, ' ');
}

// 分词函数（处理英文） - 同上
function tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .split(/[^\w'-]+/) // 使用更健壮的正则表达式处理连字符和撇号
      .filter(word => word && word.length > 1); // 过滤空字符串和单字母词
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

// 基础拼写检查 - 同上
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

// Worker 监听消息
worker.onMessage(function (res) {
  console.log('[Worker] Received data:', res); // Worker 内日志
  if (res && res.text !== undefined) {
    const customDictSet = new Set(res.customDict || []);
    const errors = checkSpelling(res.text, customDictSet);
    console.log('[Worker] Sending errors:', errors); // Worker 内日志
    // 直接使用全局 worker 对象发送消息
    worker.postMessage({
      errors: errors
    });
  } else {
    console.error('[Worker] Invalid message received:', res);
    // 直接使用全局 worker 对象发送消息
    worker.postMessage({ errors: [] }); // 发送空错误列表以防主线程卡住
  }
});

// 可选：处理 Worker 终止 (小程序 Worker 生命周期)
// worker.onProcessExit = function() {
//   console.log('[Worker] Terminated.');
// };

console.log('[Worker] Spell check worker started.');