import { sendToTelegram, formatContentForTelegram } from './_telegram.js';
import { sendToWecom, formatContentForWecom } from './_wecom.js';

export async function onRequestGet({ request, env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, type, title, content, created_at as createdAt, updated_at as updatedAt FROM content_blocks ORDER BY id DESC'
    ).all();

    return new Response(JSON.stringify(results), {
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

export async function onRequestPost({ request, env }) {
  try {
    const { type, title, content, fileType, fileSize } = await request.json();

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
      'INSERT INTO content_blocks (type, title, content, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))'
    ).bind(type, title, content).run();

    if (!success) {
      throw new Error('创建内容失败');
    }

    // 发送到 Telegram
    const telegramMessage = formatContentForTelegram(type, title, content, content);
    await sendToTelegram(env, telegramMessage);

    // 发送到企业微信
    const wecomMessage = formatContentForWecom(type, title, content, content);
    await sendToWecom(env, wecomMessage);

    return new Response(JSON.stringify({
      type,
      title,
      content
    }), {
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