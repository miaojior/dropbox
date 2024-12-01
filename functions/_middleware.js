import { initializeDatabase } from './database';

let isInitialized = false;

export async function onRequest({ request, env, next }) {
    try {
        // 确保数据库只初始化一次
        if (!isInitialized) {
            await initializeDatabase(env);
            isInitialized = true;
        }
        
        // 处理请求
        const response = await next();
        
        // 添加 CORS 头
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        
        return response;
    } catch (error) {
        console.error('请求处理失败:', error);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            details: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
} 