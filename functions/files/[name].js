export async function onRequestGet({ request, env, params }) {
    try {
        if (!env.FILES) {
            throw new Error('FILES binding not found');
        }

        const filename = params.name;
        console.log('Requesting file:', filename);
        
        // 分别获取文件内容和元数据
        const fileData = await env.FILES.get(filename, { type: 'arrayBuffer' });
        const { metadata } = await env.FILES.getWithMetadata(filename);
        
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

        // 打印调试信息
        console.log('File found:', {
            size: fileData.byteLength,
            contentType: metadata?.contentType,
            originalName: metadata?.originalName
        });

        // 创建文件的 Blob
        const blob = new Blob([fileData], { 
            type: metadata?.contentType || 'application/octet-stream' 
        });

        // 构建响应头
        const headers = new Headers({
            'Content-Type': metadata?.contentType || 'application/octet-stream',
            'Content-Length': blob.size.toString(),
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(metadata?.originalName || filename)}`,
            'Access-Control-Allow-Origin': '*'
        });

        // 返回文件
        return new Response(blob, { headers });
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