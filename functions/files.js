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

        // 将文件转换为ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // 记录上传前的信息
        console.log('Uploading file:', {
            originalName: file.name,
            size: arrayBuffer.byteLength,
            type: file.type,
            generatedName: filename
        });

        // 将文件保存到KV存储
        await env.FILES.put(filename, arrayBuffer, {
            metadata: {
                contentType: file.type || 'application/octet-stream',
                originalName: file.name,
                size: arrayBuffer.byteLength,
                uploadTime: new Date().toISOString()
            }
        });

        // 验证文件是否成功保存
        const savedFile = await env.FILES.getWithMetadata(filename, { type: 'arrayBuffer' });
        if (!savedFile.value || savedFile.value.byteLength !== arrayBuffer.byteLength) {
            throw new Error('File verification failed after upload');
        }

        console.log('File saved successfully:', {
            name: filename,
            size: savedFile.value.byteLength,
            metadata: savedFile.metadata
        });

        // 返回完整的文件URL
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        const fileUrl = `${baseUrl}/files/${filename}`;

        return new Response(
            JSON.stringify({
                url: fileUrl,
                size: arrayBuffer.byteLength,
                filename: filename,
                originalName: file.name
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