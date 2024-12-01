export async function onRequestGet({ request, env, params }) {
    try {
        if (!env.FILES) {
            throw new Error('FILES binding not found');
        }

        const filename = params.name;
        console.log('Requesting file:', filename);

        // 获取文件内容（使用arrayBuffer）
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

        // 返回文件内容
        return new Response(fileData, {
            headers: {
                'Content-Type': metadata?.contentType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata?.originalName || filename)}"`,
                'Content-Length': fileData.byteLength.toString(),
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Accept-Ranges': 'bytes'
            }
        });
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