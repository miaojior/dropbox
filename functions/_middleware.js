async function initializeDatabase(env) {
  if (!env.DB) {
    console.error('Database binding not found in environment');
    throw new Error('Database binding not found - 请在 Cloudflare Pages 设置中绑定 D1 数据库');
  }

  try {
    // 检查数据库连接
    const testQuery = await env.DB.prepare('SELECT 1').first();
    if (!testQuery) {
      throw new Error('数据库连接测试失败');
    }

    // 创建表
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
    throw new Error(`数据库初始化失败: ${error.message}`);
  }
}

// 检查密码验证
async function checkPasswordVerification(request, env) {
  // 检查是否设置了密码
  try {
    const response = await env.ACCESS_PASSWORD;
    if (!response) {
      return true; // 未设置密码，允许访问
    }

    // 检查请求头中的验证信息
    const authHeader = request.headers.get('X-Password-Verified');
    if (!authHeader) {
      return false;
    }

    // 验证格式：timestamp|hash
    const [timestamp, hash] = authHeader.split('|');
    if (!timestamp || !hash) {
      return false;
    }

    // 检查时间戳是否在15天内
    const now = Date.now();
    const verifyTime = parseInt(timestamp);
    if (now - verifyTime > 15 * 24 * 60 * 60 * 1000) {
      return false;
    }

    // 验证哈希
    const correctHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(response + timestamp)
    ).then(hash => Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));

    return hash === correctHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    
    // 检查是否是源码请求，但排除基础样式文件
    const isSourceRequest = /\.(js|json|md|sql)$/.test(url.pathname) || 
                          (/\.css$/.test(url.pathname) && !url.pathname.endsWith('/style.css'));
                          
    const isAPIRequest = url.pathname.startsWith('/_vars') || 
                        url.pathname.startsWith('/contents') || 
                        url.pathname.startsWith('/images') || 
                        url.pathname.startsWith('/files');

    // 如果是源码请求（除了基础样式），检查密码验证
    if (isSourceRequest && !isAPIRequest) {
      const isVerified = await checkPasswordVerification(context.request, context.env);
      if (!isVerified) {
        return new Response('Unauthorized', { 
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 检查环境变量
    if (!context.env.DB) {
      throw new Error('Database binding not found - 请在 Cloudflare Pages 设置中绑定 D1 数据库');
    }

    // 初始化数据库
    await initializeDatabase(context.env);
    
    // 处理请求
    const response = await context.next();
    
    // 添加安全头
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Password-Verified');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
    
    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('Middleware error:', error);
    
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Password-Verified',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Password-Verified',
        },
      }
    );
  }
} 