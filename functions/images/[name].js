export async function onRequestGet({ request, env, params }) {
    try {
        if (!env.IMAGES) {
            throw new Error('IMAGES binding not found');
        }

        const filename = params.name;
        
        // 从KV存储获取图片
        const imageData = await env.IMAGES.getWithMetadata(filename);
        if (!imageData.value) {
            return new Response('Image not found', { status: 404 });
        }

        // 返回图片，设置正确的Content-Type
        return new Response(imageData.value, {
            headers: {
                'Content-Type': imageData.metadata?.contentType || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Get image error:', error);
        return new Response('Error fetching image', { status: 500 });
    }
}

export async function onRequestDelete({ request, env, params }) {
    try {
        if (!env.IMAGES) {
            throw new Error('IMAGES binding not found');
        }

        const filename = params.name;
        
        // 从KV存储删除图片
        await env.IMAGES.delete(filename);

        return new Response(JSON.stringify({ message: '图片删除成功' }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Delete image error:', error);
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
            'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
} 