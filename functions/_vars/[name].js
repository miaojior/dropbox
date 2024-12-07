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
    
    // 如果是访问 ACCESS_PASSWORD 且未设置，返回特殊状态码 204
    if (varName === 'ACCESS_PASSWORD' && value === undefined) {
        return new Response(null, { 
            status: 204,  // 204 表示成功但无内容
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            }
        });
    }
    
    if (value === undefined) {
        return new Response('Not Found', { 
            status: 404,
            headers: {
                'Access-Control-Allow-Origin': '*'
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