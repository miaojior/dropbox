// API配置
const API_BASE_URL = '/contents';
const IMAGES_API_URL = '/images';

// 全局变量
let currentEditId = null;
let lastUpdateTime = Date.now();
let updateCheckInterval;
let contentCache = [];

// 复制函数
function copyText(text, type) {
    let copyContent = text;
    if (type === 'poetry') {
        // 保持诗歌的换行格式
        copyContent = text.split('\n').join('\r\n');
    } else if (type === 'image') {
        // 对于图片，复制URL
        copyContent = text;
    }
    
    navigator.clipboard.writeText(copyContent).then(() => {
        alert('复制成功！');
    }).catch(() => {
        // 备用复制方法
        const textarea = document.createElement('textarea');
        textarea.value = copyContent;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            alert('复制成功！');
        } catch (e) {
            alert('复制失败，请手动复制');
        }
        document.body.removeChild(textarea);
    });
}

// 类型切换函数
window.handleTypeChange = function(type) {
    const contentGroup = document.getElementById('contentGroup');
    const imageGroup = document.getElementById('imageGroup');
    const editContent = document.getElementById('editContent');
    const editImage = document.getElementById('editImage');

    if (type === 'image') {
        contentGroup.style.display = 'none';
        imageGroup.style.display = 'block';
        editContent.required = false;
        editImage.required = true;
    } else {
        contentGroup.style.display = 'block';
        imageGroup.style.display = 'none';
        editContent.required = true;
        editImage.required = false;
    }
}

// 编辑内容函数
window.editContent = function(id) {
    const content = contentCache.find(item => item.id === id);
    if (content) {
        currentEditId = content.id;
        document.getElementById('editType').value = content.type;
        document.getElementById('editTitle').value = content.title;
        document.getElementById('editContent').value = content.content;
        
        // 如果是图片类型，显示预览
        if (content.type === 'image') {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${content.content}" alt="预览">`;
        }
        
        handleTypeChange(content.type);
        document.getElementById('editModal').style.display = 'block';
    }
}

// 删除内容函数
window.deleteContent = function(id) {
    if (confirm('确定要删除这条内容吗？')) {
        fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                loadContents(true);
            } else {
                alert('删除失败');
            }
        }).catch(() => {
            alert('删除失败');
        });
    }
}

// DOM元素
document.addEventListener('DOMContentLoaded', () => {
    const contentContainer = document.getElementById('content-container');
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const addNewBtn = document.getElementById('addNewBtn');
    const editImage = document.getElementById('editImage');

    // 初始化
    loadContents(true);
    setupEventListeners();
    startUpdateCheck();

    // 设置事件监听器
    function setupEventListeners() {
        addNewBtn.addEventListener('click', () => openModal());
        editForm.addEventListener('submit', handleFormSubmit);
        editImage.addEventListener('change', handleImagePreview);
    }

    // 处理图片预览
    function handleImagePreview(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${e.target.result}" alt="预览">`;
            };
            reader.readAsDataURL(file);
        }
    }

    // 渲染内容
    function renderContents(contents) {
        if (!contents || contents.length === 0) {
            contentContainer.innerHTML = '<div class="empty">还没有任何内容，点击"添加新内容"开始创建</div>';
            return;
        }

        let html = '';
        contents.forEach(content => {
            let contentHtml = '';
            if (content.type === 'image') {
                contentHtml = `<div class="image"><img src="${content.content}" alt="${content.title}"></div>`;
            } else if (content.type === 'code') {
                contentHtml = `<pre><code class="language-javascript">${content.content}</code></pre>`;
            } else if (content.type === 'poetry') {
                contentHtml = content.content.split('\n').map(line => `<p>${line}</p>`).join('');
            } else {
                contentHtml = `<p>${content.content}</p>`;
            }

            html += `
                <section class="text-block">
                    <h2>${content.title}</h2>
                    <div class="${content.type}">
                        ${contentHtml}
                    </div>
                    <div class="text-block-actions">
                        <button class="btn" onclick="copyText('${content.content.replace(/'/g, "\\'")}', '${content.type}')">复制</button>
                        <button class="btn" onclick="editContent(${content.id})">编辑</button>
                        <button class="btn" onclick="deleteContent(${content.id})">删除</button>
                    </div>
                </section>
            `;
        });

        contentContainer.innerHTML = html;
        Prism.highlightAll();
    }

    // 开始更新检查
    function startUpdateCheck() {
        updateCheckInterval = setInterval(() => loadContents(false), 4000); // 每4秒静默更新一次
    }

    // 加载所有内容
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
                throw new Error(data.details || data.error || '加载失败');
            }
            
            const data = await response.json();
            
            // 只有在内容真正发生变化时才更新UI
            if (JSON.stringify(data) !== JSON.stringify(contentCache)) {
                contentCache = data;
                renderContents(data);
            }
            
            lastUpdateTime = Date.now();
        } catch (error) {
            console.error('加载内容失败:', error);
            if (showLoading) {
                showError(`加载内容失败: ${error.message}`);
            }
        } finally {
            if (showLoading) {
                hideLoadingState();
            }
        }
    }

    // 显示加载状态
    function showLoadingState() {
        contentContainer.innerHTML = '<div class="loading">加载中...</div>';
    }

    // 隐藏加载状态
    function hideLoadingState() {
        const loading = contentContainer.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }

    // 显示错误信息
    function showError(message) {
        contentContainer.innerHTML = `
            <div class="error">
                ${message}
                <button class="btn" onclick="location.reload()">重试</button>
            </div>
        `;
    }

    // 打开模态框
    window.openModal = function() {
        currentEditId = null;
        document.getElementById('editType').value = 'prose';
        document.getElementById('editTitle').value = '';
        document.getElementById('editContent').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('editImage').value = '';
        handleTypeChange('prose');
        document.getElementById('editModal').style.display = 'block';
    }

    // 关闭模态框
    window.closeModal = function() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('editForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        currentEditId = null;
    }

    // 处理表单提交
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        const submitButton = event.submitter;
        submitButton.disabled = true;
        const originalText = submitButton.textContent;
        submitButton.innerHTML = '保存中... <span class="loading-spinner"></span>';
        
        try {
            const type = document.getElementById('editType').value;
            const title = document.getElementById('editTitle').value;
            let content = '';
            
            if (type === 'image') {
                const imageFile = document.getElementById('editImage').files[0];
                const existingContent = document.getElementById('editContent').value;
                
                // 如果没有选择新图片且有现有图片，保持现有图片
                if (!imageFile && existingContent) {
                    content = existingContent;
                } else if (imageFile) {
                    // 上传新图片
                    const formData = new FormData();
                    formData.append('image', imageFile);
                    
                    const uploadResponse = await fetch(IMAGES_API_URL, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!uploadResponse.ok) {
                        throw new Error('图片上传失败');
                    }
                    
                    const { url } = await uploadResponse.json();
                    content = url;
                } else {
                    throw new Error('请选择图片文件');
                }
            } else {
                content = document.getElementById('editContent').value;
            }
            
            const formData = { type, title, content };
            
            if (currentEditId) {
                await updateContent(currentEditId, formData);
            } else {
                await createContent(formData);
            }
            
            closeModal();
            await loadContents(false);
        } catch (error) {
            console.error('保存失败:', error);
            alert(`保存失败: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    // 创建新内容
    async function createContent(data) {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const responseData = await response.json();
            throw new Error(responseData.details || responseData.error || '创建内容失败');
        }
        
        return await response.json();
    }

    // 更新内容
    async function updateContent(id, data) {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const responseData = await response.json();
            throw new Error(responseData.details || responseData.error || '更新内容失败');
        }
        
        return await response.json();
    }
}); 