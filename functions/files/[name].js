export async function onRequestGet({ request, env, params }) {
    try {
        if (!env.FILES || !env.CLOUDFLARE_API_TOKEN || !env.CF_ACCOUNT_ID || !env.KV_NAMESPACE_ID) {
            throw new Error('Required environment variables not found');
        }

        const filename = params.name;
        console.log('Requesting file:', filename);

        // 构建Cloudflare API URL
        const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${env.KV_NAMESPACE_ID}/values/${filename}`;
        console.log('API URL:', apiUrl);

        // 从Cloudflare API获取文件
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
            }
        });

        if (!response.ok) {
            console.error('API response not ok:', response.status, response.statusText);
            return new Response('File not found', { 
                status: response.status,
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 获取文件内容
        const fileData = await response.arrayBuffer();
        console.log('File size from API:', fileData.byteLength);

        // 获取元数据
        const { metadata } = await env.FILES.getWithMetadata(filename);
        console.log('File metadata:', metadata);

        // 获取原始响应的headers
        const originalHeaders = Object.fromEntries(response.headers.entries());
        console.log('Original response headers:', originalHeaders);

        // 创建新的响应
        const newResponse = new Response(fileData, {
            headers: {
                'Content-Type': metadata?.contentType || response.headers.get('content-type') || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata?.originalName || filename)}"`,
                'Content-Length': fileData.byteLength.toString(),
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'X-Content-Type-Options': 'nosniff'
            }
        });

        // 打印新响应的headers
        console.log('New response headers:', Object.fromEntries(newResponse.headers.entries()));
        return newResponse;

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