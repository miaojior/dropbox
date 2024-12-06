export async function onRequestPost({ env }) {
    try {
        // 1. 清空数据库内容
        await env.DB.prepare('DELETE FROM content_blocks').run();

        // 2. 获取所有图片和文件的键
        const imageKeys = await env.IMAGES.list();
        const fileKeys = await env.FILES.list();

        // 3. 删除所有图片
        for (const key of imageKeys.keys) {
            await env.IMAGES.delete(key.name);
        }

        // 4. 删除所有文件
        for (const key of fileKeys.keys) {
            await env.FILES.delete(key.name);
        }

        return new Response(JSON.stringify({ message: '所有内容已清空' }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('清空失败:', error);
        return new Response(JSON.stringify({ 
            error: '清空失败: ' + error.message 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

export function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
} 