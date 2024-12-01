export async function onRequestGet({ request, env, params }) {
    try {
        if (!env.FILES) {
            throw new Error('FILES binding not found');
        }

        const filename = params.name;
        console.log('Requesting file:', filename);
        
        // 从KV存储获取文件
        const file = await env.FILES.get(filename, { type: 'arrayBuffer' });
        const { metadata } = await env.FILES.getWithMetadata(filename);
        
        if (!file) {
            return new Response('File not found', { status: 404 });
        }

        console.log('File found:', {
            size: file.byteLength,
            metadata: metadata
        });

        // 返回文件
        return new Response(file, {
            headers: {
                'Content-Type': metadata?.contentType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata?.originalName || filename)}"`,
                'Content-Length': file.byteLength.toString(),
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*',
                'Accept-Ranges': 'bytes'
            }
        });
    } catch (error) {
        console.error('Get file error:', error);
        return new Response('Error fetching file', { status: 500 });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
} 