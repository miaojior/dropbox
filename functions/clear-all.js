import { sendToTelegram } from './_telegram.js';

export async function onRequestPost({ env }) {
    try {
        // 1. 获取当前内容数量
        const stats = await env.DB.prepare('SELECT COUNT(*) as total FROM content_blocks').first();
        const totalItems = stats.total;

        // 2. 清空数据库内容
        await env.DB.prepare('DELETE FROM content_blocks').run();

        // 3. 获取所有图片和文件的键
        const imageKeys = await env.IMAGES.list();
        const fileKeys = await env.FILES.list();

        // 4. 删除所有图片
        for (const key of imageKeys.keys) {
            await env.IMAGES.delete(key.name);
        }

        // 5. 删除所有文件
        for (const key of fileKeys.keys) {
            await env.FILES.delete(key.name);
        }

        // 6. 发送清空通知到 Telegram
        const message = `<b>🗑 内容已全部清空</b>\n\n` +
                       `<b>清空内容:</b>\n` +
                       `- 数据库记录: ${totalItems} 条\n` +
                       `- 图片文件: ${imageKeys.keys.length} 个\n` +
                       `- 其他文件: ${fileKeys.keys.length} 个\n\n` +
                       `<i>所有内容已被永久删除</i>`;
        await sendToTelegram(env, message);

        return new Response(JSON.stringify({ 
            message: '所有内容已清空',
            details: {
                records: totalItems,
                images: imageKeys.keys.length,
                files: fileKeys.keys.length
            }
        }), {
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