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
  getTagById
};