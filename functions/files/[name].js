export async function onRequestGet({ request, env, params }) {
    try {
        if (!env.FILES) {
            throw new Error('FILES binding not found');
        }

        const filename = params.name;
        console.log('Requesting file:', filename);
        
        // 从KV存储获取文件
        const file = await env.FILES.get(filename, { type: 'arrayBuffer' });
        const metadata = await env.FILES.getWithMetadata(filename);
        
        if (!file) {
            console.log('File not found:', filename);
            return new Response('File not found', { 
                status: 404,
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 返回文件，设置正确的Content-Type和Content-Disposition
        return new Response(file, {
            headers: {
                'Content-Type': metadata.metadata?.contentType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${metadata.metadata?.originalName || filename}"`,
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Get file error:', error);
        return new Response('Error fetching file: ' + error.message, { 
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

export async function onRequestDelete({ request, env, params }) {
    try {
        if (!env.FILES) {
            throw new Error('FILES binding not found');
        }

        const filename = params.name;
        
        // 从KV存储删除文件
        await env.FILES.delete(filename);

        return new Response(JSON.stringify({ message: '文件删除成功' }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Delete file error:', error);
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