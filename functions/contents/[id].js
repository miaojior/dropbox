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
      'UPDATE content_blocks SET type = ?, title = ?, content = ? WHERE id = ?'
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
      'SELECT type, content FROM content_blocks WHERE id = ?'
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

    // 如果是图片类型，删除对应的图片文件
    if (content.type === 'image' && content.content) {
      try {
        const imageFilename = content.content.split('/').pop();
        if (imageFilename && env.IMAGES) {
          await env.IMAGES.delete(imageFilename);
        }
      } catch (imageError) {
        console.error('删除图片失败:', imageError);
      }
    }

    // 删除内容记录
    const { success } = await env.DB.prepare(
      'DELETE FROM content_blocks WHERE id = ?'
    ).bind(params.id).run();

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