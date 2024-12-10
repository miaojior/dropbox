// 发送消息到 Telegram 和企业微信
async function sendToTelegram(env, message, parseMode = 'HTML') {
  // 如果没有配置 Telegram，直接返回
  if (!env.TG_BOT_TOKEN || !env.TG_CHAT_ID) {
    return null;
  }

  try {
    // 确保消息不超过限制
    const truncatedMessage = truncateMessage(message, 'telegram');

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

// 发送消息到企业微信机器人
async function sendToWecom(env, message) {
  // 如果没有配置企业微信机器人，直接返回
  if (!env.WECOM_BOT_URL) {
    return null;
  }

  try {
    // 确保消息不超过限制
    const truncatedMessage = truncateMessage(message, 'wecom');

    const response = await fetch(env.WECOM_BOT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msgtype: 'markdown',
        markdown: {
          content: truncatedMessage
        }
      }),
    });

    const result = await response.json();
    if (result.errcode !== 0) {
      console.error(`企业微信 API 错误: ${result.errmsg}`);
      return null;
    }

    return result;
  } catch (error) {
    console.error('发送消息到企业微信失败:', error);
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

// 格式化内容为企业微信消息
function formatContentForWecom(type, title, content, url = null, isEdit = false) {
  let message = `**${isEdit ? '内容已更新' : '新' + (type === 'file' ? '文件' : type === 'image' ? '图片' : '内容') + '上传'}**\n\n`;
  message += `**标题:** ${title}\n`;
  
  if (type === 'text' || type === 'code' || type === 'poetry') {
    message += `**内容:**\n`;
    if (type === 'code') {
      message += '```\n' + content + '\n```';
    } else {
      message += content;
    }
  } else if (type === 'file' || type === 'image') {
    message += `**链接:** ${url}`;
  }

  if (isEdit) {
    message += '\n\n*此内容已被编辑*';
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

// 截断消息以符合平台限制
function truncateMessage(message, platform = 'telegram') {
  const MAX_LENGTH = platform === 'telegram' ? 4000 : 4096; // Telegram和企业微信的限制
  
  if (message.length <= MAX_LENGTH) {
    return message;
  }

  // 检查是否包含代码块
  const codeBlockPattern = platform === 'telegram' 
    ? /<pre><code>([\s\S]*?)<\/code><\/pre>/
    : /```[\s\S]*?\n([\s\S]*?)```/;

  const codeBlockMatch = message.match(codeBlockPattern);
  if (codeBlockMatch) {
    const beforeCode = message.substring(0, codeBlockMatch.index);
    const afterCode = message.substring(codeBlockMatch.index + codeBlockMatch[0].length);
    const code = codeBlockMatch[1];
    
    // 如果代码太长，截断代码
    if (code.length > MAX_LENGTH - 200) { // 预留200字符给其他内容
      const truncatedCode = code.substring(0, MAX_LENGTH - 200) + '...(已截断)';
      if (platform === 'telegram') {
        return beforeCode + '<pre><code>' + truncatedCode + '</code></pre>' + afterCode;
      } else {
        return beforeCode + '```\n' + truncatedCode + '\n```' + afterCode;
      }
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

export { sendToTelegram, sendToWecom, formatContentForTelegram, formatContentForWecom, formatDeleteNotification };