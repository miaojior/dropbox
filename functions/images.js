export async function onRequestPost({ request, env }) {
    try {
        if (!env.IMAGES) {
            throw new Error('IMAGES binding not found');
        }

        const formData = await request.formData();
        const imageFile = formData.get('image');
        
        if (!imageFile) {
            throw new Error('No image file provided');
        }

        // 生成唯一的文件名
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = imageFile.name.split('.').pop().toLowerCase();
        const filename = `${timestamp}-${randomString}.${extension}`;

        // 将图片保存到KV存储
        const arrayBuffer = await imageFile.arrayBuffer();
        await env.IMAGES.put(filename, arrayBuffer, {
            metadata: {
                contentType: imageFile.type,
                filename: imageFile.name,
                size: arrayBuffer.byteLength
            }
        });

        console.log('Image saved:', filename, 'Size:', arrayBuffer.byteLength, 'Type:', imageFile.type);

        // 返回完整的图片URL
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        const imageUrl = `${baseUrl}/images/${filename}`;

        return new Response(
            JSON.stringify({
                url: imageUrl,
                filename: filename,
                size: arrayBuffer.byteLength,
                type: imageFile.type
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

export async function onRequestGet({ request, env }) {
    try {
        if (!env.IMAGES) {
            throw new Error('IMAGES binding not found');
        }

        const url = new URL(request.url);
        const filename = url.pathname.split('/').pop();
        
        // 从KV存储获取图片
        const metadata = await env.IMAGES.getWithMetadata(filename);
        if (!metadata.value) {
            return new Response('Image not found', { status: 404 });
        }

        // 返回图片
        return new Response(metadata.value, {
            headers: {
                'Content-Type': metadata.metadata?.contentType || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Get image error:', error);
        return new Response('Error fetching image', { status: 500 });
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