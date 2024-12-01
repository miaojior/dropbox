export async function onRequest(context) {
  try {
    const formData = await context.request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: '没有找到文件' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const filename = `${timestamp}-${randomString}.${extension}`;

    // 将文件转换为arrayBuffer并上传
    const arrayBuffer = await file.arrayBuffer();
    await context.env.FILES.put(filename, arrayBuffer, {
      metadata: {
        contentType: file.type,
        filename: originalName,
        size: arrayBuffer.byteLength,
        httpMetadata: {
          contentType: file.type,
          contentDisposition: `attachment; filename="${originalName}"`
        }
      }
    });

    console.log('File saved:', filename, 'Size:', arrayBuffer.byteLength, 'Type:', file.type);

    // 返回文件的URL
    const url = `${new URL(context.request.url).origin}/files/${filename}`;
    
    return new Response(JSON.stringify({ 
      url,
      filename,
      size: arrayBuffer.byteLength,
      type: file.type
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 