async function loadContents(showLoading = true) {
    try {
        if (showLoading) {
            showLoadingState();
        }
        
        const response = await fetch(API_BASE_URL, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const data = await response.json();
            if (response.status === 403) {
                throw new Error('访问被拒绝：' + (data.message || '您没有访问权限'));
            }
            throw new Error(data.details || data.error || '加载失败');
        }
        
        const data = await response.json();
        contentCache = data || [];
        renderContents(contentCache);
        lastUpdateTime = Date.now();
    } catch (error) {
        console.error('加载内容失败:', error);
        if (showLoading) {
            showError(`${error.message}`);
        }
    } finally {
        if (showLoading) {
            hideLoadingState();
        }
    }
} 