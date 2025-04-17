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
  'a', 'an', 'the', 'i', 'you', 'he', 'she', 'we', 'they',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could',
  'markdown', 'editor', 'spell', 'check', 'code', 'block',
  'javascript', 'html', 'css', 'mini', 'program', 'wechat', 'wx', 'api'
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

// 基础拼写检查 - 同上
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