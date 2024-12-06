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

    const safeType = String(type);
    const safeTitle = String(title);
    const safeContent = String(content);
    const safeId = String(params.id);

    const { success } = await env.DB.prepare(
      'UPDATE content_blocks SET type = ?, title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(safeType, safeTitle, safeContent, safeId).run();

    if (!success) {
      return new Response(JSON.stringify({ error: '内容不存在' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const { results } = await env.DB.prepare(
      'SELECT id, type, title, content, created_at as createdAt, updated_at as updatedAt FROM content_blocks WHERE id = ?'
    ).bind(safeId).all();

    return new Response(JSON.stringify(results[0]), {
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