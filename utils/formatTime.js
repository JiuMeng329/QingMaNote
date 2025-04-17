/**
 * 格式化时间戳为相对时间（例如：几秒前、几分钟前、几小时前、几天前）
 * @param {Number|String|Date} timestamp 时间戳 (毫秒)、时间字符串或Date对象
 * @return {String} 格式化后的相对时间字符串
 */
const timeAgo = function(timestamp) {
  if (!timestamp) return '未知时间';

  let date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    // 尝试多种格式解析，优先标准格式
    date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        // 兼容 iOS 的 '-' 分隔符
       date = new Date(timestamp.replace(/-/g, '/'));
    }
  } else {
    return '无效时间';
  }

  // 再次检查日期是否有效
  if (isNaN(date.getTime())) {
      return '无效时间';
  }


  const now = new Date();
  const diff = now.getTime() - date.getTime(); // 时间差（毫秒）
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30); // 粗略计算
  const years = Math.floor(days / 365); // 粗略计算

  if (years > 0) {
    return years + ' 年前';
  } else if (months > 0) {
    return months + ' 个月前';
  } else if (days > 0) {
    return days + ' 天前';
  } else if (hours > 0) {
    return hours + ' 小时前';
  } else if (minutes > 0) {
    return minutes + ' 分钟前';
  } else if (seconds >= 0) {
    return seconds <= 5 ? '刚刚' : seconds + ' 秒前';
  } else {
    // 如果时间在未来，显示具体日期时间
    return formatDate(date, 'yyyy-MM-dd hh:mm');
  }
};

/**
 * 格式化日期对象或时间戳为指定格式的字符串
 * @param {Date|Number|String} date Date对象、时间戳或时间字符串
 * @param {String} fmt 格式字符串，例如 'yyyy-MM-dd hh:mm:ss'
 * @return {String} 格式化后的日期字符串
 */
const formatDate = function(date, fmt) {
  if (!date) return '';
  if (!(date instanceof Date)) {
    if (typeof date === 'number') {
      date = new Date(date);
    } else if (typeof date === 'string') {
       // 尝试多种格式解析，优先标准格式
        let parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
             // 兼容 iOS 的 '-' 分隔符
            parsedDate = new Date(date.replace(/-/g, '/'));
        }
       date = parsedDate;
    } else {
      return '';
    }
  }

   // 再次检查日期是否有效
  if (isNaN(date.getTime())) {
      return '';
  }


  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds(), // 毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + '').substr(4 - RegExp.$1.length)
    );
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      );
    }
  }
  return fmt;
};

module.exports = {
  timeAgo,
  formatDate
};
