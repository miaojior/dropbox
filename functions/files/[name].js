export async function onRequestGet({ request, env, params }) {
    try {
        if (!env.FILES) {
            throw new Error('FILES binding not found');
        }

        const filename = params.name;
        console.log('Requesting file:', filename);
        
        // 从KV存储获取文件和元数据
        const { value, metadata } = await env.FILES.getWithMetadata(filename, 'arrayBuffer');
        if (!value) {
            console.log('File not found:', filename);
            return new Response('File not found', { 
                status: 404,
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        console.log('File found:', {
            size: value.byteLength,
            metadata: metadata
        });

        // 返回文件
        return new Response(value, {
            headers: {
                'Content-Type': metadata?.contentType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata?.originalName || filename)}"`,
                'Content-Length': value.byteLength.toString(),
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache'
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