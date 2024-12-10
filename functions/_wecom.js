// 发送消息到企业微信机器人
async function sendToWecom(env, message) {
  // 如果没有配置企业微信机器人，直接返回
  if (!env.WECOM_BOT_URL) {
    return null;
  }

  try {
    // 确保消息不超过限制
    const truncatedMessage = truncateMessage(message);

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

// 格式化内容为企业微信消息
function formatContentForWecom(type, title, content, url = null, isEdit = false) {
  // 企业微信 markdown 中使用 > 引用块来突出显示重要信息
  let message = `> ${isEdit ? '内容已更新' : '新' + (type === 'file' ? '文件' : type === 'image' ? '图片' : '内容') + '上传'}\n\n`;
  message += `**标题：**${title}\n`;
  
  if (type === 'text' || type === 'code' || type === 'poetry') {
    message += `**内容：**\n`;
    // 对于代码类型，使用引用块格式（企业微信不支持代码块语法）
    if (type === 'code') {
      message += '> ' + content.split('\n').join('\n> ');
    } else {
      message += content;
    }
  } else if (type === 'file' || type === 'image') {
    message += `**链接：**[点击查看](${url})`;
  }

  if (isEdit) {
    message += '\n\n*此内容已被编辑*';
  }

  return message;
}

// 格式化删除通知
function formatDeleteNotification(type, title) {
  return `> 🗑 内容已删除\n\n` +
         `**类型：**${type === 'file' ? '文件' : type === 'image' ? '图片' : '内容'}\n` +
         `**标题：**${title}\n\n` +
         `*此内容已被永久删除*`;
}

// 截断消息以符合企业微信限制
function truncateMessage(message) {
  const MAX_LENGTH = 4000; // 企业微信消息长度限制
  
  if (message.length <= MAX_LENGTH) {
    return message;
  }

  // 检查是否包含引用块
  const lines = message.split('\n');
  let length = 0;
  let truncatedLines = [];

  for (const line of lines) {
    if (length + line.length + 1 > MAX_LENGTH - 3) {
      truncatedLines.push('...(已截断)');
      break;
    }
    truncatedLines.push(line);
    length += line.length + 1; // +1 for newline
  }

  return truncatedLines.join('\n');
}

export { sendToWecom, formatContentForWecom, formatDeleteNotification }; 