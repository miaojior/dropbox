export async function onRequestGet({ params, env }) {
  try {
    const filename = params.filename;
    const file = await env.FILES.get(filename);

    if (!file) {
      return new Response('文件不存在', { status: 404 });
    }

    // 获取原始文件名（如果存储时保存了的话）
    const originalName = file.httpMetadata?.contentDisposition?.match(/filename="(.+)"/)?.[1] || filename;

    return new Response(file.body, {
      headers: {
        'Content-Type': file.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${originalName}"`,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
} 