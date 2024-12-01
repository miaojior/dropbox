export async function onRequestGet({ env }) {
  try {
    if (!env.DB) {
      throw new Error('Database binding not found');
    }

    const { results } = await env.DB.prepare(
      'SELECT * FROM content_blocks ORDER BY created_at DESC'
    ).all();
    
    return new Response(JSON.stringify(results || []), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Database error',
      details: error.message
    }), {
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
    if (!env.DB) {
      throw new Error('Database binding not found');
    }

    const { type, title, content } = await request.json();
    if (!type || !title || !content) {
      return new Response(JSON.stringify({ 
        error: 'Validation error',
        details: '缺少必要字段'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const { results } = await env.DB.prepare(
      'INSERT INTO content_blocks (type, title, content) VALUES (?, ?, ?) RETURNING *'
    ).bind(type, title, content).all();

    return new Response(JSON.stringify(results[0]), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Database error',
      details: error.message
    }), {
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