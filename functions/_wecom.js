// 发送消息到企业微信
async function sendToWecom(env, message) {
  // 如果没有配置企业微信，直接返回
  if (!env.WECOM_CORPID || !env.WECOM_CORPSECRET || !env.WECOM_AGENTID) {
    return null;
  }

  try {
    // 1. 获取访问令牌
    const tokenResponse = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${env.WECOM_CORPID}&corpsecret=${env.WECOM_CORPSECRET}`
    );
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('Failed to get WeChat Work access token:', tokenData.errmsg);
      return null;
    }

    // 2. 发送消息
    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${tokenData.access_token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          touser: env.WECOM_TOUSER || '@all',
          msgtype: 'text',
          agentid: env.WECOM_AGENTID,
          text: {
            content: message,
          },
        }),
      }
    );

    const result = await response.json();
    if (result.errcode !== 0) {
      console.error(`WeChat Work API error: ${result.errmsg}`);
      return null;
    }

    return result;
  } catch (error) {
    console.error('Failed to send message to WeChat Work:', error);
    return null;
  }
}

// 格式化内容为企业微信消息
function formatContentForWecom(type, title, content, url = null, isEdit = false) {
  let message = `${isEdit ? '内容已更新' : '新' + (type === 'file' ? '文件' : type === 'image' ? '图片' : '内容') + '上传'}\n\n`;
  message += `标题: ${title}\n`;
  
  if (type === 'text' || type === 'code' || type === 'poetry') {
    message += `内容:\n`;
    if (type === 'code') {
      message += `\`\`\`\n${content}\n\`\`\``;
    } else {
      message += content;
    }
  } else if (type === 'file' || type === 'image') {
    message += `链接: ${url}`;
  }

  if (isEdit) {
    message += '\n\n此内容已被编辑';
  }

  return message;
}

// 格式化删除通知
function formatDeleteNotificationWecom(type, title) {
  return `🗑 内容已删除\n\n` +
         `类型: ${type === 'file' ? '文件' : type === 'image' ? '图片' : '内容'}\n` +
         `标题: ${title}\n\n` +
         `此内容已被永久删除`;
}

export { sendToWecom, formatContentForWecom, formatDeleteNotificationWecom }; 