// utils/document.js

/**
 * 文档管理工具函数
 * 提供文档的创建、保存、加载、删除等功能
 */

// 获取应用实例
const app = getApp();

/**
 * 保存文档到本地存储
 * @param {Object} document 文档对象，包含id、title、content等属性
 * @return {Boolean} 保存是否成功
 */
const saveDocument = function(document) {
  try {
    if (!document || !document.id) {
      console.error('保存文档失败：文档ID不能为空');
      return false;
    }
    
    // 获取所有文档列表
    let documents = wx.getStorageSync('markmark_documents') || [];
    
    // 查找是否已存在该文档
    const index = documents.findIndex(doc => doc.id === document.id);
    
    // 添加更新时间
    document.updateTime = new Date().getTime();
    
    if (index > -1) {
      // 更新已有文档
      documents[index] = { ...documents[index], ...document };
    } else {
      // 添加新文档
      documents.push(document);
    }
    
    // 保存到本地存储
    wx.setStorageSync('markmark_documents', documents);
    
    // 更新最近文档列表
    updateRecentDocuments(document.id);
    
    return true;
  } catch (e) {
    console.error('保存文档失败：', e);
    return false;
  }
};

/**
 * 从本地存储加载文档
 * @param {String} docId 文档ID
 * @return {Object|null} 文档对象，如果不存在则返回null
 */
const loadDocument = function(docId) {
  try {
    if (!docId) {
      console.error('加载文档失败：文档ID不能为空');
      return null;
    }
    
    // 获取所有文档列表
    const documents = wx.getStorageSync('markmark_documents') || [];
    
    // 查找文档
    const document = documents.find(doc => doc.id === docId);
    
    if (!document) {
      console.error('加载文档失败：未找到ID为' + docId + '的文档');
      return null;
    }
    
    // 更新最近文档列表
    updateRecentDocuments(docId);
    
    return document;
  } catch (e) {
    console.error('加载文档失败：', e);
    return null;
  }
};

/**
 * 创建新文档
 * @param {Object} document 文档对象，包含title、content等属性
 * @return {String|null} 新创建的文档ID，如果创建失败则返回null
 */
const createDocument = function(document) {
  try {
    if (!document) {
      console.error('创建文档失败：文档对象不能为空');
      return null;
    }
    
    // 生成唯一ID
    const docId = 'doc_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
    
    // 创建文档对象
    const newDocument = {
      id: docId,
      title: document.title || '未命名文档',
      content: document.content || '',
      createTime: new Date().getTime(),
      updateTime: new Date().getTime(),
      tags: document.tags || [],
      favorite: false
    };
    
    // 保存文档
    if (saveDocument(newDocument)) {
      return docId;
    } else {
      return null;
    }
  } catch (e) {
    console.error('创建文档失败：', e);
    return null;
  }
};

/**
 * 删除文档
 * @param {String} docId 文档ID
 * @return {Boolean} 删除是否成功
 */
const deleteDocument = function(docId) {
  try {
    if (!docId) {
      console.error('删除文档失败：文档ID不能为空');
      return false;
    }
    
    // 获取所有文档列表
    let documents = wx.getStorageSync('markmark_documents') || [];
    
    // 过滤掉要删除的文档
    documents = documents.filter(doc => doc.id !== docId);
    
    // 保存到本地存储
    wx.setStorageSync('markmark_documents', documents);
    
    // 更新最近文档列表
    removeFromRecentDocuments(docId);
    
    return true;
  } catch (e) {
    console.error('删除文档失败：', e);
    return false;
  }
};

/**
 * 获取所有文档列表
 * @return {Array} 文档列表
 */
const getAllDocuments = function() {
  try {
    return wx.getStorageSync('markmark_documents') || [];
  } catch (e) {
    console.error('获取文档列表失败：', e);
    return [];
  }
};

/**
 * 更新最近文档列表
 * @param {String} docId 文档ID
 */
const updateRecentDocuments = function(docId) {
  try {
    if (!docId) return;
    
    // 获取最近文档列表
    let recentDocs = wx.getStorageSync('markmark_recent_documents') || [];
    
    // 移除已存在的相同ID
    recentDocs = recentDocs.filter(id => id !== docId);
    
    // 添加到列表开头
    recentDocs.unshift(docId);
    
    // 限制列表长度为10
    if (recentDocs.length > 10) {
      recentDocs = recentDocs.slice(0, 10);
    }
    
    // 保存到本地存储
    wx.setStorageSync('markmark_recent_documents', recentDocs);
  } catch (e) {
    console.error('更新最近文档列表失败：', e);
  }
};

/**
 * 从最近文档列表中移除
 * @param {String} docId 文档ID
 */
const removeFromRecentDocuments = function(docId) {
  try {
    if (!docId) return;
    
    // 获取最近文档列表
    let recentDocs = wx.getStorageSync('markmark_recent_documents') || [];
    
    // 移除指定ID
    recentDocs = recentDocs.filter(id => id !== docId);
    
    // 保存到本地存储
    wx.setStorageSync('markmark_recent_documents', recentDocs);
  } catch (e) {
    console.error('从最近文档列表移除失败：', e);
  }
};

/**
 * 获取最近文档列表
 * @param {Number} limit 限制数量，默认为5
 * @return {Array} 文档列表
 */
const getRecentDocuments = function(limit = 5) {
  try {
    // 获取最近文档ID列表
    const recentDocIds = wx.getStorageSync('markmark_recent_documents') || [];
    
    if (recentDocIds.length === 0) return [];
    
    // 获取所有文档
    const allDocuments = getAllDocuments();
    
    // 根据ID获取文档详情，并限制数量
    const recentDocs = recentDocIds
      .slice(0, limit)
      .map(id => allDocuments.find(doc => doc.id === id))
      .filter(doc => doc); // 过滤掉不存在的文档
    
    return recentDocs;
  } catch (e) {
    console.error('获取最近文档列表失败：', e);
    return [];
  }
};

/**
 * 获取收藏的文档列表
 * @return {Array} 文档列表
 */
const getFavoriteDocuments = function() {
  try {
    // 获取所有文档
    const allDocuments = getAllDocuments();
    
    // 过滤出收藏的文档
    return allDocuments.filter(doc => doc.favorite);
  } catch (e) {
    console.error('获取收藏文档列表失败：', e);
    return [];
  }
};

/**
 * 切换文档收藏状态
 * @param {String} docId 文档ID
 * @return {Boolean} 操作是否成功
 */
const toggleFavorite = function(docId) {
  try {
    if (!docId) return false;
    
    // 加载文档
    const doc = loadDocument(docId);
    
    if (!doc) return false;
    
    // 切换收藏状态
    doc.favorite = !doc.favorite;
    
    // 保存文档
    return saveDocument(doc);
  } catch (e) {
    console.error('切换文档收藏状态失败：', e);
    return false;
  }
};

/**
 * 根据标签获取文档列表
 * @param {String} tagId 标签ID
 * @return {Array} 文档列表
 */
const getDocumentsByTag = function(tagId) {
  try {
    if (!tagId) return [];
    
    // 获取所有文档
    const allDocuments = getAllDocuments();
    
    // 过滤出包含指定标签的文档
    return allDocuments.filter(doc => doc.tags && doc.tags.includes(tagId));
  } catch (e) {
    console.error('根据标签获取文档列表失败：', e);
    return [];
  }
};

/**
 * 搜索文档
 * @param {String} keyword 搜索关键词
 * @return {Array} 文档列表
 */
const searchDocuments = function(keyword) {
  try {
    if (!keyword) return [];
    
    // 获取所有文档
    const allDocuments = getAllDocuments();
    
    // 搜索标题和内容
    return allDocuments.filter(doc => {
      return doc.title.toLowerCase().includes(keyword.toLowerCase()) || 
             doc.content.toLowerCase().includes(keyword.toLowerCase());
    });
  } catch (e) {
    console.error('搜索文档失败：', e);
    return [];
  }
};

/**
 * 获取所有标签
 * @return {Array} 标签列表
 */
const getAllTags = function() {
  try {
    return wx.getStorageSync('markmark_tags') || [];
  } catch (e) {
    console.error('获取标签列表失败：', e);
    return [];
  }
};

/**
 * 保存标签到本地存储
 * @param {Object} tag 标签对象，包含id、name、color等属性
 * @return {Boolean} 保存是否成功
 */
const saveTag = function(tag) {
  try {
    if (!tag || !tag.id) {
      console.error('保存标签失败：标签ID不能为空');
      return false;
    }
    
    // 获取所有标签列表
    let tags = getAllTags();
    
    // 查找是否已存在该标签
    const index = tags.findIndex(t => t.id === tag.id);
    
    if (index > -1) {
      // 更新已有标签 (不再需要保留 count)
      tags[index] = { ...tags[index], ...tag }; // 直接合并，count 会被新的 tag 对象覆盖（如果新对象有的话），或者保持不变（如果新对象没有） - 这里不再需要关心 count
    } else {
      // 添加新标签
      tags.push(tag);
    }
    
    // 保存到本地存储
    wx.setStorageSync('markmark_tags', tags);
    
    return true;
  } catch (e) {
    console.error('保存标签失败：', e);
    return false;
  }
};

/**
 * 创建新标签
 * @param {Object} tag 标签对象，包含name、color、description等属性
 * @return {String|null} 新创建的标签ID，如果创建失败则返回null
 */
const createTag = function(tag) {
  try {
    if (!tag) {
      console.error('创建标签失败：标签对象不能为空');
      return null;
    }
    
    // 生成唯一ID
    const tagId = 'tag_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
    
    // 创建标签对象 (移除 count)
    const newTag = {
      id: tagId,
      name: tag.name || '未命名标签',
      color: tag.color || '#1890FF',
      description: tag.description || ''
    };
    
    // 保存标签
    if (saveTag(newTag)) {
      return tagId;
    } else {
      return null;
    }
  } catch (e) {
    console.error('创建标签失败：', e);
    return null;
  }
};

/**
 * 删除标签
 * @param {String} tagId 标签ID
 * @return {Boolean} 删除是否成功
 */
const deleteTag = function(tagId) {
  try {
    if (!tagId) {
      console.error('删除标签失败：标签ID不能为空');
      return false;
    }
    
    // 获取所有标签列表
    let tags = getAllTags();
    
    // 过滤掉要删除的标签
    tags = tags.filter(tag => tag.id !== tagId);
    
    // 保存到本地存储
    wx.setStorageSync('markmark_tags', tags);
    
    // 从所有文档中移除此标签
    const documents = getAllDocuments();
    let needUpdate = false;
    
    documents.forEach(doc => {
      if (doc.tags && doc.tags.includes(tagId)) {
        doc.tags = doc.tags.filter(id => id !== tagId);
        needUpdate = true;
      }
    });
    
    // 如果有文档修改，保存更新
    if (needUpdate) {
      wx.setStorageSync('markmark_documents', documents);
    }
    
    return true;
  } catch (e) {
    console.error('删除标签失败：', e);
    return false;
  }
};

/**
 * 根据ID获取标签
 * @param {String} tagId 标签ID
 * @return {Object|null} 标签对象，如果不存在则返回null
 */
const getTagById = function(tagId) {
  try {
    if (!tagId) {
      console.error('获取标签失败：标签ID不能为空');
      return null;
    }
    
    // 获取所有标签
    const tags = getAllTags();
    
    // 查找标签
    return tags.find(tag => tag.id === tagId) || null;
  } catch (e) {
    console.error('获取标签失败：', e);
    return null;
  }
};

/**
 * 添加文档到标签
 * @param {String} docId 文档ID
 * @param {String} tagId 标签ID
 * @return {Boolean} 操作是否成功
 */
const addDocumentToTag = function(docId, tagId) {
  try {
    if (!docId || !tagId) {
      console.error('添加文档到标签失败：文档ID和标签ID不能为空');
      return false;
    }
    
    // 确认标签存在
    const tag = getTagById(tagId);
    if (!tag) {
      console.error('添加文档到标签失败：标签不存在');
      return false;
    }
    
    // 加载文档
    const doc = loadDocument(docId);
    if (!doc) {
      console.error('添加文档到标签失败：文档不存在');
      return false;
    }
    
    // 检查文档的标签列表是否已包含此标签
    if (!doc.tags) {
      doc.tags = [];
    }
    
    // 如果标签已存在，则无需添加
    if (doc.tags.includes(tagId)) {
      return true;
    }
    
    // 添加标签ID到文档标签列表
    doc.tags.push(tagId);
    
    // 保存文档
    return saveDocument(doc);
  } catch (e) {
    console.error('添加文档到标签失败：', e);
    return false;
  }
};

/**
 * 从标签中移除文档
 * @param {String} docId 文档ID
 * @param {String} tagId 标签ID
 * @return {Boolean} 操作是否成功
 */
const removeDocumentFromTag = function(docId, tagId) {
  try {
    if (!docId || !tagId) {
      console.error('从标签中移除文档失败：文档ID和标签ID不能为空');
      return false;
    }
    
    // 加载文档
    const doc = loadDocument(docId);
    if (!doc) {
      console.error('从标签中移除文档失败：文档不存在');
      return false;
    }
    
    // 确保文档有标签数组且包含此标签
    if (!doc.tags || !doc.tags.includes(tagId)) {
      // 标签不存在，视为移除成功
      return true;
    }
    
    // 从文档标签列表中移除标签ID
    doc.tags = doc.tags.filter(id => id !== tagId);
    
    // 保存文档
    return saveDocument(doc);
  } catch (e) {
    console.error('从标签中移除文档失败：', e);
    return false;
  }
};




/**
 * 创建示例文档
 * 向用户的文档库中添加示例文档
 * @return {Boolean} 操作是否成功
 */
const createSampleDocuments = function() {
  try {
    // 获取文档列表，检查是否已存在示例文档
    const documents = wx.getStorageSync('markmark_documents') || [];
    const hasReadmeDoc = documents.some(doc => doc.title === '欢迎使用轻码笔记应用👋');
    const hasMarkdownDoc = documents.some(doc => doc.title === 'Markdown语法支持指南 📝');
    const hasExamplesDoc = documents.some(doc => doc.title === '示例文件目录 📁');
    
    if (hasReadmeDoc && hasMarkdownDoc && hasExamplesDoc) {
      // 所有示例文档都已存在，无需再次创建
      return true;
    }
    
    // README示例文档
    if (!hasReadmeDoc) {
      createDocument({
        title: '欢迎使用轻码笔记应用👋',
        content: `# 欢迎使用轻码笔记应用👋

你好呀，我是轻码笔记，你的学习与工作的效率提升伙伴🚀。

在这个信息爆炸的时代，希望帮助你更好地管理你的想法、任务和笔记，让每一天都更加高效有序。

# 功能介绍✨

* 💾 **实时保存**  
  我们非常重视你的每一条笔记和想法，所有内容都会实时自动保存，即使设备突然断电，你的数据也不会丢失。

* 📝 **专业写作模式**  
  为喜欢写作的用户提供了专业的写作环境，清晰的段落布局，舒适的阅读体验。还可以开启专注模式，让你全身心投入创作。支持多级分类管理，轻松整理你的文章和笔记。

* ⏰ **智能提醒**  
  内置任务管理系统，支持设置优先级和截止日期，系统级提醒确保你不会错过任何重要事项。

* 🎨 **界面自定义**  
  丰富的自定义选项让应用更符合你的使用习惯。包括自定义主题、字体、背景色、快捷键设置等，全部免费使用，让你的使用体验更加个性化和舒适。

# 高级功能🔑

以下是我们后续开发的的高级功能：

* 📱 **快速记录**  
  通过桌面小组件或通知栏快速添加笔记，捕捉灵感的瞬间。

* ☁️ **云端同步**  
  数据自动云端备份，支持多设备无缝切换，随时随地访问你的内容。

* 📋 **智能剪贴板**  
  智能识别剪贴板内容，自动分类并保存到相应的笔记中。

* 🔄 **多平台集成**  
  与常用社交平台和生产力工具无缝集成，一键分享或导入内容。

* ✨ **更多功能持续更新中**  
  我们会不断听取用户反馈，持续优化和增加新功能。

用心做产品，让每一次使用都成为美好体验。

> 详细使用指南请查看：轻码笔记全面支持Markdown语法文件 或关注我们的官方公众号：轻码笔记`,
        tags: []
      });
    }
    
    // Markdown语法指南文档
    if (!hasMarkdownDoc) {
      createDocument({
        title: 'Markdown语法支持指南 📝',
        content: `# Markdown语法支持指南 📝

轻码笔记全面支持Markdown语法，让你的笔记更加结构化、美观且易于阅读。本文将介绍所有已实现的Markdown功能，帮助你快速掌握这些强大的格式化工具。

## 基础语法 ⚡

### 标题

使用\`#\`符号创建不同级别的标题：

\`\`\`markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
\`\`\`

### 文本格式化

\`\`\`markdown
*斜体文本* 或 _斜体文本_
**粗体文本** 或 __粗体文本__
***粗斜体文本*** 或 ___粗斜体文本___
~~删除线文本~~
\`\`\`

### 列表

无序列表：
\`\`\`markdown
* 项目1
* 项目2
  * 子项目A
  * 子项目B
\`\`\`

有序列表：
\`\`\`markdown
1. 第一项
2. 第二项
3. 第三项
\`\`\`

任务列表：
\`\`\`markdown
- [x] 已完成任务
- [ ] 未完成任务
\`\`\`

### 引用

\`\`\`markdown
> 这是一段引用文本
> 
> 这是引用的第二段
\`\`\`

### 分割线

\`\`\`markdown
---
或
***
或
___
\`\`\`

### 链接

\`\`\`markdown
[链接文本](https://www.example.com)
<https://www.example.com>
\`\`\`

### 图片

\`\`\`markdown
![图片描述](图片URL)
\`\`\`

## 高级语法 🚀

### 代码

行内代码：
\`\`\`markdown
\`console.log('Hello World')\`
\`\`\`

代码块：
\`\`\`\`markdown
\`\`\`javascript
function sayHello() {
  console.log('Hello World');
}
\`\`\`
\`\`\`\`

支持的代码高亮语言：
- javascript/js
- python
- java
- c/cpp
- html
- css
- json
- markdown
- sql
- bash/shell
...以及更多

### 表格

\`\`\`markdown
| 表头1 | 表头2 | 表头3 |
| ----- | ----- | ----- |
| 单元格1 | 单元格2 | 单元格3 |
| 单元格4 | 单元格5 | 单元格6 |
\`\`\`

对齐方式：
\`\`\`markdown
| 左对齐 | 居中对齐 | 右对齐 |
| :----- | :-----: | -----: |
| 内容 | 内容 | 内容 |
\`\`\`

### 数学公式

行内公式：
\`\`\`markdown
$E=mc^2$
\`\`\`

独立公式：
\`\`\`markdown
$$
\\frac{n!}{k!(n-k)!} = \\binom{n}{k}
$$
\`\`\`

### 脚注

\`\`\`markdown
这里有一个脚注[^1]

[^1]: 这是脚注内容
\`\`\`

### 目录生成

\`\`\`markdown
[TOC]
\`\`\`

## 轻码笔记特有功能 💫

### 高亮标记

\`\`\`markdown
==高亮文本==
\`\`\`

### 上标和下标

\`\`\`markdown
H~2~O (下标)
X^2^ (上标)
\`\`\`

### 自定义容器

\`\`\`markdown
::: info
这是一个信息提示框
:::

::: warning
这是一个警告提示框
:::

::: success
这是一个成功提示框
:::

::: danger
这是一个危险提示框
:::
\`\`\`

### 流程图支持

\`\`\`markdown
\`\`\`mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
\`\`\`
\`\`\`


## 实时预览 👁️

轻码笔记支持实时预览功能，让你在编辑的同时即时查看Markdown渲染效果。可以选择以下预览模式：

- 分屏预览：同时显示编辑区和预览区
- 即时预览：边输入边显示渲染效果
- 纯编辑模式：专注于内容创作
- 纯预览模式：查看最终效果

## 导出选项 📤

你可以将Markdown笔记导出为以下格式：

- HTML
- PDF
- Word文档
- 图片
- 纯文本

---

通过掌握这些Markdown语法，你可以在轻码笔记中创建结构清晰、格式丰富的笔记和文档。如有任何问题，欢迎随时联系我们的支持团队！`,
        tags: []
      });
    }
    
    // 文件目录示例文档
    if (!hasExamplesDoc) {
      createDocument({
        title: '示例文件目录 📁',
        content: `# 示例文件目录 📁

这里汇总了轻码笔记应用的所有示例文件，方便你快速了解我们的功能和使用方法。

## 核心文档

| 文件名 | 描述 |
| ------ | ---- |
| 欢迎使用轻码笔记应用👋 | 轻码笔记应用介绍和核心功能概览 |
| Markdown语法支持指南 📝 | Markdown语法支持详细指南 |

## 如何使用这些示例文件

1. 浏览这些文件，了解轻码笔记的功能和特性
2. 将这些文件导入到你的轻码笔记应用中作为参考
3. 基于这些模板创建你自己的笔记和文档

我们会持续更新和添加更多示例文件，帮助你更好地使用轻码笔记。如有任何建议，欢迎随时反馈！`,
        tags: []
      });
    }
    
    return true;
  } catch (e) {
    console.error('创建示例文档失败：', e);
    return false;
  }
};

/**
 * 创建示例标签
 * 创建一个"示例文档"标签，并将示例文档添加到该标签中
 * @return {Boolean} 操作是否成功
 */
const createSampleTag = function() {
  try {
    // 获取标签列表，检查是否已存在示例标签
    const tags = getAllTags();
    const hasSampleTag = tags.some(tag => tag.name === '示例文档');
    
    if (hasSampleTag) {
      // 示例标签已存在，无需再次创建
      return true;
    }
    
    // 创建示例标签
    const tagId = createTag({
      name: '示例文档',
      color: '#3E7FFF', // 使用主题色
      description: '轻码笔记的示例文档集合，包含应用介绍和使用指南'
    });
    
    if (!tagId) {
      console.error('创建示例标签失败');
      return false;
    }
    
    // 获取示例文档列表
    const documents = getAllDocuments();
    const readmeDoc = documents.find(doc => doc.title === '欢迎使用轻码笔记应用👋');
    const markdownDoc = documents.find(doc => doc.title === 'Markdown语法支持指南 📝');
    const examplesDoc = documents.find(doc => doc.title === '示例文件目录 📁');
    
    // 将示例文档添加到标签中
    if (readmeDoc) {
      addDocumentToTag(readmeDoc.id, tagId);
    }
    
    if (markdownDoc) {
      addDocumentToTag(markdownDoc.id, tagId);
    }
    
    if (examplesDoc) {
      addDocumentToTag(examplesDoc.id, tagId);
    }
    
    return true;
  } catch (e) {
    console.error('创建示例标签失败：', e);
    return false;
  }
};

module.exports = {
  saveDocument,
  loadDocument,
  createDocument,
  deleteDocument,
  getAllDocuments,
  getRecentDocuments,
  getFavoriteDocuments,
  toggleFavorite,
  getDocumentsByTag,
  searchDocuments,
  getAllTags,
  saveTag,
  createTag,
  deleteTag,
  getTagById,
  addDocumentToTag,
  removeDocumentFromTag,
  createSampleDocuments,
  createSampleTag
};