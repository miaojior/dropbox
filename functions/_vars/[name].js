export async function onRequestGet({ params, env }) {
    const varName = params.name;
    
    // 只允许访问特定的环境变量
    const allowedVars = ['SYNC_INTERVAL', 'ACCESS_PASSWORD'];
    
    if (!allowedVars.includes(varName)) {
        return new Response('Forbidden', { 
            status: 403,
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    // 获取环境变量值
    const value = env[varName];
    
    if (value === undefined) {
        return new Response('Not Found', { 
            status: 404,
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    // 如果是访问密码，返回哈希值而不是原始密码
    if (varName === 'ACCESS_PASSWORD') {
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return new Response(hashHex, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            }
        });
    }
    
    return new Response(value, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
        }
    });
}

export function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
} 