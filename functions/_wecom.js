// 发送消息到企业微信
let accessTokenCache = {
  token: null,
  expireTime: 0
};

const MAX_MESSAGE_LENGTH = 2048; // 企业微信消息最大长度限制
const TOKEN_EXPIRE_TIME = 7200000; // access_token 有效期2小时（毫秒）
const MAX_RETRIES = 3; // 最大重试次数

// 获取 access_token，带缓存机制
async function getAccessToken(env) {
  const now = Date.now();
  
  // 如果缓存的 token 还有效，直接返回
  if (accessTokenCache.token && now < accessTokenCache.expireTime) {
    return accessTokenCache.token;
  }

  try {
    const tokenResponse = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${env.WECOM_CORPID}&corpsecret=${env.WECOM_CORPSECRET}`
    );
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('获取 access_token 失败');
    }

    // 更新缓存
    accessTokenCache = {
      token: tokenData.access_token,
      expireTime: now + TOKEN_EXPIRE_TIME - 60000 // 提前1分钟过期
    };

    return accessTokenCache.token;
  } catch (error) {
    console.error('获取 access_token 失败:', error.message);
    throw error;
  }
}

// 发送消息到企业微信
async function sendToWecom(env, message, retryCount = 0) {
  // 如果没有配置企业微信，直接返回
  if (!env.WECOM_CORPID || !env.WECOM_CORPSECRET || !env.WECOM_AGENTID) {
    return null;
  }

  try {
    const accessToken = await getAccessToken(env);
    
    // 确保消息不超过限制
    const truncatedMessage = message.length > MAX_MESSAGE_LENGTH 
      ? message.substring(0, MAX_MESSAGE_LENGTH - 3) + '...'
      : message;

    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
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
            content: truncatedMessage,
          },
          safe: 0 // 普通消息
        }),
      }
    );

    const result = await response.json();
    
    // 处理 token 过期情况
    if (result.errcode === 42001 && retryCount < MAX_RETRIES) {
      accessTokenCache.token = null; // 清除缓存的 token
      return sendToWecom(env, message, retryCount + 1);
    }

    if (result.errcode !== 0) {
      throw new Error(`发送消息失败: ${result.errmsg}`);
    }

    return result;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      // 延迟重试，每次重试增加延迟
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return sendToWecom(env, message, retryCount + 1);
    }
    console.error('发送消息到企业微信失败:', error.message);
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