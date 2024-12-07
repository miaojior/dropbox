// 发送消息到 Telegram
async function sendToTelegram(env, message, parseMode = 'HTML') {
  // 如果没有配置 Telegram，直接返回
  if (!env.TG_BOT_TOKEN || !env.TG_CHAT_ID) {
    return null;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: env.TG_CHAT_ID,
        text: message,
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
function formatContentForTelegram(type, title, content, url = null) {
  let message = `<b>新${type === 'file' ? '文件' : type === 'image' ? '图片' : '内容'}上传</b>\n\n`;
  message += `<b>标题:</b> ${escapeHtml(title)}\n`;
  
  if (type === 'text' || type === 'code' || type === 'poetry') {
    message += `<b>内���:</b>\n${escapeHtml(content)}`;
  } else if (type === 'file' || type === 'image') {
    message += `<b>链接:</b> ${url}`;
  }

  return message;
}

// HTML 转义
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export { sendToTelegram, formatContentForTelegram }; 