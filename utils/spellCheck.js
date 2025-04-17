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
  'a', 'an', 'the', 'i', 'you', 'he', 'she', 'we', 'they',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could',
  // 添加更多常用单词...
  'markdown', 'editor', 'spell', 'check', 'code', 'block',
  'javascript', 'html', 'css', 'mini', 'program', 'wechat', 'wx', 'api'
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

// 基础拼写检查
function checkSpelling(text, customDict = new Set()) {
  const plainText = extractPlainText(text);
  const words = tokenize(plainText);
  const combinedDict = new Set([...BASE_DICTIONARY, ...customDict]);
  
  const errors = new Set();
  for (const word of words) {
    if (!combinedDict.has(word)) {
      errors.add(word);
    }
  }
  return Array.from(errors);
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