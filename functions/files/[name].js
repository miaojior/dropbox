export async function onRequestGet({ request, env, params }) {
    try {
        if (!env.FILES) {
            throw new Error('FILES binding not found');
        }

        const filename = params.name;
        console.log('Requesting file:', filename);
        console.log('Request URL:', request.url);
        console.log('Request headers:', Object.fromEntries(request.headers.entries()));

        // 直接从KV获取文件内容
        const fileData = await env.FILES.get(filename, { type: 'arrayBuffer' });
        if (!fileData) {
            console.log('File not found:', filename);
            return new Response('File not found', { 
                status: 404,
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 获取元数据
        const { metadata } = await env.FILES.getWithMetadata(filename);

        // 打印调试信息
        console.log('File found:', {
            contentType: metadata?.contentType,
            originalName: metadata?.originalName,
            size: fileData.byteLength
        });

        // 创建响应
        const response = new Response(fileData, {
            headers: {
                'Content-Type': metadata?.contentType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata?.originalName || filename)}"`,
                'Content-Length': fileData.byteLength.toString(),
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'X-Content-Type-Options': 'nosniff'
            }
        });

        // 打印响应信息
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('Response size:', fileData.byteLength);

        return response;
    } catch (error) {
        console.error('Get file error:', error);
        console.error('Error stack:', error.stack);
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