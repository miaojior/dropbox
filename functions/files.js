export async function onRequestPost({ request, env }) {
    try {
        if (!env.FILES) {
            throw new Error('FILES binding not found');
        }

        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
            throw new Error('No file provided');
        }

        // 检查文件大小
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (file.size > maxSize) {
            throw new Error(`File size exceeds limit (25MB), current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }

        // 生成唯一的文件名
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split('.').pop().toLowerCase();
        const filename = `${timestamp}-${randomString}.${extension}`;

        // 将文件转换为ArrayBuffer并保存
        const arrayBuffer = await file.arrayBuffer();
        await env.FILES.put(filename, arrayBuffer, {
            metadata: {
                contentType: file.type || 'application/octet-stream',
                originalName: file.name,
                size: arrayBuffer.byteLength
            }
        });

        console.log('File saved:', filename, 'Size:', arrayBuffer.byteLength, 'Type:', file.type);

        // 返回完整的文件URL
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        const fileUrl = `${baseUrl}/files/${filename}`;

        return new Response(
            JSON.stringify({
                url: fileUrl,
                filename: filename,
                size: arrayBuffer.byteLength,
                type: file.type
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        );
    } catch (error) {
        console.error('Upload error:', error);
        return new Response(
            JSON.stringify({
                error: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        );
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
} 