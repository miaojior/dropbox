import { sendToTelegram, formatContentForTelegram } from '../_telegram.js';
import { sendToWecom, formatContentForWecom } from '../_wecom.js';

export async function onRequestPut({ request, env, params }) {
  try {
    const { type, title, content } = await request.json();
    if (!type || !title || !content) {
      return new Response(JSON.stringify({ error: '缺少必要字段' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const { success } = await env.DB.prepare(
      'UPDATE content_blocks SET type = ?, title = ?, content = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(type, title, content, params.id).run();

    if (!success) {
      return new Response(JSON.stringify({ error: '内容不存在' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 发送到 Telegram，添加编辑标记
    const telegramMessage = formatContentForTelegram(type, title, content, content, true);
    await sendToTelegram(env, telegramMessage);

    // 发送到企业微信，添加编辑标记
    const wecomMessage = formatContentForWecom(type, title, content, content, true);
    await sendToWecom(env, wecomMessage);

    return new Response(JSON.stringify({ id: params.id, type, title, content }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    // 首先获取内容信息
    const content = await env.DB.prepare(
      'SELECT type, title, content FROM content_blocks WHERE id = ?'
    ).bind(params.id).first();

    if (!content) {
      return new Response(JSON.stringify({ error: '内容不存在' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 如果是文件类型，从URL中提取文件名并删除KV中的文件
    if (content.type === 'file' || content.type === 'image') {
      try {
        const url = new URL(content.content);
        const filename = url.pathname.split('/').pop();

        // 根据类型选择正确的KV存储
        const storage = content.type === 'file' ? env.FILES : env.IMAGES;
        if (storage) {
          await storage.delete(filename);
          console.log(`Deleted ${content.type} from KV:`, filename);
        }
      } catch (storageError) {
        console.error(`Error deleting ${content.type} from KV:`, storageError);
      }
    }

    // 删除内容记录
    const { success } = await env.DB.prepare(
      'DELETE FROM content_blocks WHERE id = ?'
    ).bind(params.id).run();

    // 发送删除通知到 Telegram
    const message = `<b>🗑 内容已删除</b>\n\n` +
                   `<b>类型:</b> ${getContentTypeName(content.type)}\n` +
                   `<b>标题:</b> ${content.title}\n\n` +
                   `<i>此内容已被永久删除</i>`;
    await sendToTelegram(env, message);

    return new Response(JSON.stringify({ message: '删除成功' }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 获取内容类型的友好名称
function getContentTypeName(type) {
  const typeNames = {
    'text': '文本',
    'code': '代码',
    'poetry': '诗歌',
    'image': '图片',
    'file': '文件'
  };
  return typeNames[type] || type;
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
} 