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
        const extension = imageFile.name.split('.').pop();
        const filename = `${timestamp}-${randomString}.${extension}`;

        // 将图片保存到KV存储
        await env.IMAGES.put(filename, imageFile.stream(), {
            metadata: {
                contentType: imageFile.type,
                filename: imageFile.name
            }
        });

        // 获取当前域名
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;

        // 返回完整的图片URL
        return new Response(
            JSON.stringify({
                url: `${baseUrl}/images/${filename}`
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

export async function onRequestGet({ request, env, params }) {
    try {
        if (!env.IMAGES) {
            throw new Error('IMAGES binding not found');
        }

        const url = new URL(request.url);
        const filename = url.pathname.split('/').pop();
        
        // 从KV存储获取图片
        const image = await env.IMAGES.get(filename, 'stream');
        if (!image) {
            return new Response('Image not found', { status: 404 });
        }

        // 获取图片元数据
        const metadata = await env.IMAGES.get(filename, { type: 'metadata' });
        
        // 返回图片
        return new Response(image, {
            headers: {
                'Content-Type': metadata?.contentType || 'image/jpeg',
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
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
} 