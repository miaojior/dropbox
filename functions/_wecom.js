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
  
  if (accessTokenCache.token && now < accessTokenCache.expireTime) {
    return accessTokenCache.token;
  }

  try {
    const tokenResponse = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${env.WECOM_CORPID}&corpsecret=${env.WECOM_CORPSECRET}`
    );

    if (!tokenResponse.ok) {
      throw new Error(`HTTP 请求失败: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error(tokenData.errmsg || '获取 access_token 失败');
    }

    accessTokenCache = {
      token: tokenData.access_token,
      expireTime: now + TOKEN_EXPIRE_TIME - 60000
    };

    return accessTokenCache.token;
  } catch (error) {
    throw new Error('获取 access_token 失败: ' + error.message);
  }
}

// 发送消息到企业微信
async function sendToWecom(env, message, retryCount = 0) {
  // 如果没有配置企业微信，直接返回
  if (!env.WECOM_CORPID || !env.WECOM_CORPSECRET || !env.WECOM_AGENTID) {
    return { ok: false, error: '企业微信配置不完整，请检查环境变量设置' };
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
          safe: 0,
          enable_duplicate_check: 1,
          duplicate_check_interval: 1800
        }),
      }
    );

    if (!response.ok) {
      return { 
        ok: false, 
        error: `HTTP 请求失败: ${response.status} ${response.statusText}`,
        status: response.status
      };
    }

    const result = await response.json();
    
    // 处理常见错误情况
    if (result.errcode !== 0) {
      let errorMessage = '';
      
      switch (result.errcode) {
        case 42001:
          errorMessage = 'access_token 已过期';
          if (retryCount < MAX_RETRIES) {
            accessTokenCache.token = null;
            return sendToWecom(env, message, retryCount + 1);
          }
          break;
        case 40014:
          errorMessage = 'access_token 无效，请检查 CORPSECRET 是否正确';
          break;
        case 81013:
          errorMessage = '用户未关注该应用，请先在企业微信中关注应用';
          break;
        case 40056:
          errorMessage = '接收用户无效';
          break;
        case 60011:
          errorMessage = '应用未获得管理员审批，请先在企业微信后台确认应用可见范围';
          break;
        default:
          errorMessage = result.errmsg;
      }
      
      return { 
        ok: false, 
        error: errorMessage,
        errcode: result.errcode,
        errmsg: result.errmsg
      };
    }

    return { 
      ok: true, 
      msgid: result.msgid,
      message: '消息发送成功'
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      return sendToWecom(env, message, retryCount + 1);
    }
    return { 
      ok: false, 
      error: '发送消息失败: ' + error.message,
      isNetworkError: true
    };
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