// API配置
const API_BASE_URL = '/contents';
const IMAGES_API_URL = '/images';

// 全局变量
let currentEditId = null;
let lastUpdateTime = Date.now();
let updateCheckInterval;
let contentCache = [];

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

    // 处理类型切换
    window.handleTypeChange = function(type) {
        const contentGroup = document.getElementById('contentGroup');
        const imageGroup = document.getElementById('imageGroup');
        const editContent = document.getElementById('editContent');
        const editImage = document.getElementById('editImage');
        const imagePreview = document.getElementById('imagePreview');

        if (type === 'image') {
            contentGroup.style.display = 'none';
            imageGroup.style.display = 'block';
            editContent.required = false;
            editImage.required = !editContent.value; // 只有在没有现有图片时才需要
            
            // 如果有现有图片，显示预览
            if (editContent.value) {
                imagePreview.innerHTML = `<img src="${editContent.value}" alt="预览">`;
            }
        } else {
            contentGroup.style.display = 'block';
            imageGroup.style.display = 'none';
            editContent.required = true;
            editImage.required = false;
        }
    };

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

    // 渲染内容
    function renderContents(contents) {
        // 如果内容为空，显示空状态
        if (!contents || contents.length === 0) {
            contentContainer.innerHTML = '<div class="empty">还没有任何内容，点击"添加新内容"开始创建</div>';
            return;
        }

        // 创建新的内容HTML
        const tempContainer = document.createElement('div');
        
        contents.forEach(content => {
            const section = document.createElement('section');
            section.className = 'text-block';
            section.dataset.id = content.id;
            
            const h2 = document.createElement('h2');
            h2.textContent = content.title;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = content.type;
            
            if (content.type === 'image') {
                const img = document.createElement('img');
                img.src = content.content;
                img.alt = content.title;
                contentDiv.appendChild(img);
            } else if (content.type === 'code') {
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                code.className = 'language-javascript';
                code.textContent = content.content;
                pre.appendChild(code);
                contentDiv.appendChild(pre);
            } else if (content.type === 'poetry') {
                content.content.split('\n').forEach(line => {
                    const p = document.createElement('p');
                    p.textContent = line;
                    contentDiv.appendChild(p);
                });
            } else {
                const p = document.createElement('p');
                p.textContent = content.content;
                contentDiv.appendChild(p);
            }
            
            const actions = document.createElement('div');
            actions.className = 'text-block-actions';
            actions.innerHTML = `
                <button class="btn btn-edit" onclick="editContent(${content.id})">编辑</button>
                <button class="btn btn-delete" onclick="deleteContent(${content.id})">删除</button>
            `;
            
            section.appendChild(h2);
            section.appendChild(contentDiv);
            section.appendChild(actions);
            tempContainer.appendChild(section);
        });

        // 只有当内容真正变化时才更新DOM
        if (contentContainer.innerHTML !== tempContainer.innerHTML) {
            contentContainer.innerHTML = tempContainer.innerHTML;
            // 重新初始化代码高亮
            Prism.highlightAll();
        }
    }

    // 打开模态框
    window.openModal = function(content = null) {
        currentEditId = content ? content.id : null;
        document.getElementById('editType').value = content ? content.type : 'prose';
        document.getElementById('editTitle').value = content ? content.title : '';
        document.getElementById('editContent').value = content ? content.content : '';
        
        // 如果是图片类型，显示预览
        if (content && content.type === 'image') {
            const imagePreview = document.getElementById('imagePreview');
            imagePreview.innerHTML = `<img src="${content.content}" alt="${content.title}">`;
        }
        
        // 触发类型切换处理
        handleTypeChange(content ? content.type : 'prose');
        
        editModal.style.display = 'block';
    }

    // 关闭模态框
    window.closeModal = function() {
        editModal.style.display = 'none';
        editForm.reset();
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

    // 编辑内容
    window.editContent = function(id) {
        try {
            // 从缓存中获取内容
            const content = contentCache.find(item => item.id === id);
            if (!content) {
                throw new Error('内容不存在');
            }
            openModal(content);
        } catch (error) {
            console.error('获取内容失败:', error);
            alert(`获取内容失败: ${error.message}`);
        }
    }

    // 删除内容
    window.deleteContent = async function(id) {
        if (!confirm('确定要删除这条内容吗？')) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.details || data.error || '删除失败');
            }
            
            // 从缓存中移除被删除的内容
            contentCache = contentCache.filter(item => item.id !== id);
            renderContents(contentCache);
            
            // 静默更新以确保与服务器同步
            await loadContents(false);
        } catch (error) {
            console.error('删除失败:', error);
            alert(`删除失败: ${error.message}`);
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