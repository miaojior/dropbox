// 发送消息到 Telegram
async function sendToTelegram(env, message, parseMode = 'HTML') {
  // 如果没有配置 Telegram，直接返回
  if (!env.TG_BOT_TOKEN || !env.TG_CHAT_ID) {
    return null;
  }

  try {
    // 确保消息不超过限制
    const truncatedMessage = truncateMessage(message);

    const response = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: env.TG_CHAT_ID,
        text: truncatedMessage,
        parse_mode: parseMode,
        disable_web_page_preview: false
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error(`Telegram API error: ${result.description}`);
      return null;
    }

    return result;
  } catch (error) {
    console.error('Failed to send message to Telegram:', error);
    return null;
  }
}

// 格式化内容为 Telegram 消息
function formatContentForTelegram(type, title, content, url = null, isEdit = false) {
  let message = `<b>${isEdit ? '内容已更新' : '新' + (type === 'file' ? '文件' : type === 'image' ? '图片' : '内容') + '上传'}</b>\n\n`;
  message += `<b>标题:</b> ${escapeHtml(title)}\n`;
  
  if (type === 'text' || type === 'code' || type === 'poetry') {
    message += `<b>内容:</b>\n`;
    // 对于代码类型，使用代码格式
    if (type === 'code') {
      message += `<pre><code>${escapeHtml(content)}</code></pre>`;
    } else {
      message += escapeHtml(content);
    }
  } else if (type === 'file' || type === 'image') {
    message += `<b>链接:</b> ${url}`;
  }

  if (isEdit) {
    message += '\n\n<i>此内容已被编辑</i>';
  }

  return message;
}

// 格式化删除通知
function formatDeleteNotification(type, title) {
  return `<b>🗑 内容已删除</b>\n\n` +
         `<b>类型:</b> ${type === 'file' ? '文件' : type === 'image' ? '图片' : '内容'}\n` +
         `<b>标题:</b> ${escapeHtml(title)}\n\n` +
         `<i>此内容已被永久删除</i>`;
}

// 截断消息以符合 Telegram 限制
function truncateMessage(message) {
  const MAX_LENGTH = 4000; // 留一些余地给可能的格式化字符
  
  if (message.length <= MAX_LENGTH) {
    return message;
  }

  // 检查是否包含代码块
  const codeBlockMatch = message.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/);
  if (codeBlockMatch) {
    const beforeCode = message.substring(0, codeBlockMatch.index);
    const afterCode = message.substring(codeBlockMatch.index + codeBlockMatch[0].length);
    const code = codeBlockMatch[1];
    
    // 如果代码太长，截断代码
    if (code.length > MAX_LENGTH - 200) { // 预留200字符给其他内容
      const truncatedCode = code.substring(0, MAX_LENGTH - 200) + '...(已截断)';
      return beforeCode + '<pre><code>' + truncatedCode + '</code></pre>' + afterCode;
    }
  }

  // 普通文本的截断
  return message.substring(0, MAX_LENGTH - 3) + '...';
}

// HTML 转义
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export { sendToTelegram, formatContentForTelegram, formatDeleteNotification };