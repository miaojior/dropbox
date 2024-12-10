// 发送消息到企业微信机器人
async function sendToWecom(env, message) {
  // 从完整的webhook URL中提取key
  const key = env.WECOM_BOT_URL?.split('key=')[1];
  if (!key) {
    console.error('未配置企业微信群机器人key');
    return null;
  }

  try {
    // 确保消息不超过限制
    const truncatedMessage = truncateMessage(message);
    
    // 构建标准的企业微信webhook URL
    const webhookUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}`;
    
    const messageData = {
      msgtype: "text",
      text: {
        content: truncatedMessage,
        mentioned_list: ["@all"]
      }
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return null;
  }
}

// 格式化内容为企业微信消息
function formatContentForWecom(type, title, content, url = null, isEdit = false) {
  let message = `${isEdit ? '内容已更新' : '新' + (type === 'file' ? '文件' : type === 'image' ? '图片' : '内容') + '上传'}\n`;
  message += `标题：${title}\n`;
  
  if (type === 'text' || type === 'code' || type === 'poetry') {
    message += `内容：\n${content}`;
  } else if (type === 'file' || type === 'image') {
    message += `链接：${url}`;
  }

  if (isEdit) {
    message += '\n此内容已被编辑';
  }

  return message;
}

// 格式化删除通知
function formatDeleteNotification(type, title) {
  return `🗑 内容已删除\n` +
         `类型：${type === 'file' ? '文件' : type === 'image' ? '图片' : '内容'}\n` +
         `标题：${title}\n` +
         `此内容已被永久删除`;
}

// 截断消息以符合企业微信限制
function truncateMessage(message) {
  const MAX_LENGTH = 2048;
  return message.length <= MAX_LENGTH ? message : message.substring(0, MAX_LENGTH - 3) + '...';
}

export { sendToWecom, formatContentForWecom, formatDeleteNotification }; 