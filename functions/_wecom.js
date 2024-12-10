// 发送消息到企业微信机器人
async function sendToWecom(env, message) {
  // 如果没有配置企业微信机器人，直接返回
  if (!env.WECOM_BOT_URL) {
    console.error('未配置企业微信群机器人webhook地址');
    return null;
  }

  try {
    // 确保消息不超过限制
    const truncatedMessage = truncateMessage(message);
    
    // 使用更简单的文本消息格式
    const messageData = {
      msgtype: 'text',
      text: {
        content: truncatedMessage
      }
    };

    console.log('准备发送消息到企业微信:', truncatedMessage);
    
    const response = await fetch(env.WECOM_BOT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    const result = await response.json();
    console.log('企业微信响应:', result);

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
  let message = `${isEdit ? '内容已更新' : '新' + (type === 'file' ? '文件' : type === 'image' ? '图片' : '内容') + '上传'}\n\n`;
  message += `标题：${title}\n`;
  
  if (type === 'text' || type === 'code' || type === 'poetry') {
    message += `内容：\n`;
    if (type === 'code') {
      // 使用普通文本格式
      message += content;
    } else {
      message += content;
    }
  } else if (type === 'file' || type === 'image') {
    message += `链接：${url}`;
  }

  if (isEdit) {
    message += '\n\n此内容已被编辑';
  }

  return message;
}

// 格式化删除通知
function formatDeleteNotification(type, title) {
  return `🗑 内容已删除\n\n` +
         `类型：${type === 'file' ? '文件' : type === 'image' ? '图片' : '内容'}\n` +
         `标题：${title}\n\n` +
         `此内容已被永久删除`;
}

// 截断消息以符合企业微信限制
function truncateMessage(message) {
  const MAX_LENGTH = 2048; // 企业微信文本消息长度限制
  
  if (message.length <= MAX_LENGTH) {
    return message;
  }

  return message.substring(0, MAX_LENGTH - 3) + '...';
}

export { sendToWecom, formatContentForWecom, formatDeleteNotification }; 