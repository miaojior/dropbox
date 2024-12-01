// 允许的IP地址列表
const ALLOWED_IPS = [
  '123.45.67.89',    // 你的IP地址
  '98.76.54.32',     // 其他允许的IP
  '111.222.333.444'  // 更多IP...
];

// 检查IP是否在允许列表中
function isIpAllowed(ip) {
  return ALLOWED_IPS.includes(ip);
}

// 获取真实IP地址
function getClientIP(request) {
  // 从 CF-Connecting-IP 头获取真实IP
  const ip = request.headers.get('CF-Connecting-IP');
  // 如果没有CF-Connecting-IP，则尝试从X-Forwarded-For获取
  if (!ip) {
    const forwardedFor = request.headers.get('X-Forwarded-For');
    return forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  }
  return ip;
}

async function initializeDatabase(env) {
  if (!env.DB) {
    throw new Error('Database binding not found');
  }

  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS content_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function onRequest(context) {
  try {
    const clientIP = getClientIP(context.request);
    console.log('Current IP:', clientIP);
    
    // 如果不是OPTIONS请求，则验证IP
    if (context.request.method !== 'OPTIONS') {
      if (!clientIP || !isIpAllowed(clientIP)) {
        return new Response(JSON.stringify({
          error: '访问被拒绝',
          message: '您的IP地址没有访问权限'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }
    }

    // 初始化数据库
    await initializeDatabase(context.env);
    
    // 处理请求
    const response = await context.next();
    
    // 添加 CORS 头
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // 如果是 OPTIONS 请求，返回 CORS 头
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // 返回错误响应
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
} 