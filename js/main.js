// API配置
const API_BASE_URL = '/contents';
const IMAGES_API_URL = '/images';
const FILES_API_URL = '/files';
const DOWNLOAD_API_URL = '/download';

// 全局变量
let currentEditId = null;
let lastUpdateTime = Date.now();
let updateCheckInterval;
let contentCache = [];
let contentContainer;

// 工具函数
function getFileIcon(filename) {
    // 获取文件扩展名
    const ext = filename.toLowerCase().split('.').pop();
    
    // Markdown文件
    if (['md', 'markdown', 'mdown', 'mkd'].includes(ext)) return 'markdown';
    
    // 图片文件
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'heic'].includes(ext)) return 'image';
    
    // 文档文件
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx', 'rtf', 'odt', 'pages'].includes(ext)) return 'word';
    if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext)) return 'excel';
    if (['ppt', 'pptx', 'odp', 'key'].includes(ext)) return 'powerpoint';
    if (['txt', 'log', 'ini', 'conf', 'cfg'].includes(ext)) return 'text';
    
    // 代码文件
    if (['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'scss', 'less', 'sass', 'php', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'swift', 'kt', 'rs', 'dart', 'vue', 'sql', 'sh', 'bash', 'yml', 'yaml', 'xml'].includes(ext)) return 'code';
    
    // 压缩文件
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz'].includes(ext)) return 'archive';
    
    // 视频文件
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp', 'mpg', 'mpeg', 'ogv'].includes(ext)) return 'video';
    
    // 音频文件
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'opus', 'mid', 'midi'].includes(ext)) return 'audio';
    
    return 'generic';
}

function getFileTypeDescription(filename) {
    // 获取文件扩展名
    const ext = filename.toLowerCase().split('.').pop();
    
    // Markdown文件
    if (['md', 'markdown', 'mdown', 'mkd'].includes(ext)) return 'Markdown文档';
    
    // 图片文件
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'heic'].includes(ext)) return '图片文件';
    
    // 文档文件
    if (ext === 'pdf') return 'PDF文档';
    if (['doc', 'docx', 'rtf', 'odt', 'pages'].includes(ext)) return 'Word文档';
    if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext)) return 'Excel表格';
    if (['ppt', 'pptx', 'odp', 'key'].includes(ext)) return 'PowerPoint演示文稿';
    if (['txt', 'log'].includes(ext)) return '文本文件';
    if (['ini', 'conf', 'cfg'].includes(ext)) return '配置文件';
    
    // 代码文件
    if (['js', 'ts'].includes(ext)) return 'JavaScript/TypeScript文件';
    if (['jsx', 'tsx'].includes(ext)) return 'React组件';
    if (ext === 'vue') return 'Vue组件';
    if (ext === 'html') return 'HTML文件';
    if (['css', 'scss', 'less', 'sass'].includes(ext)) return '样式表';
    if (ext === 'php') return 'PHP文件';
    if (ext === 'py') return 'Python文件';
    if (ext === 'java') return 'Java文件';
    if (['c', 'cpp'].includes(ext)) return 'C/C++文件';
    if (ext === 'cs') return 'C#文件';
    if (ext === 'go') return 'Go文件';
    if (ext === 'rb') return 'Ruby文件';
    if (ext === 'swift') return 'Swift文件';
    if (ext === 'kt') return 'Kotlin文件';
    if (ext === 'rs') return 'Rust文件';
    if (ext === 'dart') return 'Dart文件';
    if (ext === 'sql') return 'SQL文件';
    if (['sh', 'bash'].includes(ext)) return 'Shell脚本';
    if (['yml', 'yaml'].includes(ext)) return 'YAML配置';
    if (ext === 'xml') return 'XML文件';
    
    // 压缩文件
    if (['zip', 'rar', '7z'].includes(ext)) return '压缩文件';
    if (['tar', 'gz', 'bz2', 'xz', 'tgz'].includes(ext)) return '归档文件';
    
    // 视频文件
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp', 'mpg', 'mpeg', 'ogv'].includes(ext)) return '视频文件';
    
    // 音频文件
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'opus'].includes(ext)) return '音频文件';
    if (['mid', 'midi'].includes(ext)) return 'MIDI音乐';
    
    return `${ext.toUpperCase()}文件`;
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '未知大小';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function encodeContent(text) {
    return btoa(unescape(encodeURIComponent(text)));
}

function decodeContent(encoded) {
    return decodeURIComponent(escape(atob(encoded)));
}

// 显示提示函数
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 复制函数
function copyText(encodedText, type) {
    const text = decodeContent(encodedText);
    let copyContent = text;
    
    if (type === 'poetry') {
        copyContent = text.split('\n').join('\r\n');
    } else if (type === 'image') {
        copyContent = text;
    }
    
    navigator.clipboard.writeText(copyContent).then(() => {
        showToast('复制成功！');
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = copyContent;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('复制成功！');
        } catch (e) {
            showToast('复制失败，请手动复制', 'error');
        }
        document.body.removeChild(textarea);
    });
}

// 显示确认对话框
function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        
        dialog.innerHTML = `
            <div class="confirm-dialog-content">
                <div class="confirm-dialog-title">${title}</div>
                <div class="confirm-dialog-message">${message}</div>
                <div class="confirm-dialog-buttons">
                    <button class="btn btn-cancel">取消</button>
                    <button class="btn btn-primary">确定</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const buttons = dialog.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                dialog.remove();
                resolve(button.classList.contains('btn-primary'));
            });
        });
    });
}

// 获取文件图标URL
function getFileIconUrl(filename) {
    // 获取文件扩展名
    const ext = filename.toLowerCase().split('.').pop();
    // 使用在线图标服务
    return `https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@main/icons/${ext}.svg`;
}

// 下载文件函数
async function downloadFile(url, filename) {
    try {
        // 获取文件扩展名
        const ext = filename.toLowerCase().split('.').pop();
        
        // 图片和图片类型的文件使用 Blob 下载
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
        if (imageTypes.includes(ext)) {
            showToast('准备下载图片...');
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            showToast('图片下载完成');
        } else {
            // 其他类型的文件直接在新窗口打开
            showToast('正在打开文件...');
            window.open(url, '_blank');
        }
    } catch (error) {
        console.error('下载失败:', error);
        showToast('下载失败，请重试', 'error');
    }
}

// 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 渲染内容函数
function renderContents(contents) {
    if (!contentContainer) {
        contentContainer = document.getElementById('content-container');
    }
    
    if (!contents || contents.length === 0) {
        contentContainer.innerHTML = '<div class="empty">还没有任何内容，点击"添加新内容"开始创建</div>';
        return;
    }

    let html = '';
    contents.forEach(content => {
        let contentHtml = '';
        let downloadButton = '';
        
        if (content.type === 'image' || content.type === 'file') {
            if (content.type === 'image') {
                contentHtml = `<div class="image"><img src="${content.content}" alt="${content.title}"></div>`;
            } else {
                const fileIcon = getFileIcon(content.title);
                const fileType = getFileTypeDescription(content.title);
                contentHtml = `
                    <div class="file">
                        <i class="file-icon ${fileIcon}"></i>
                        <div class="file-details">
                            <div class="file-name">${content.title}</div>
                            <div class="file-type">${fileType}</div>
                        </div>
                    </div>`;
            }
            downloadButton = `<button class="btn btn-download" onclick="downloadFile('${content.content}', '${content.title}')">下载</button>`;
        } else if (content.type === 'code') {
            contentHtml = `<pre><code class="language-javascript">${content.content}</code></pre>`;
        } else if (content.type === 'poetry') {
            contentHtml = content.content.split('\n').map(line => `<p>${line}</p>`).join('');
        } else {
            contentHtml = content.content.split('\n').map(line => `<p>${line}</p>`).join('');
        }

        const encodedContent = encodeContent(content.content);
        const modifiedDate = formatDate(content.updatedAt || content.createdAt || Date.now());

        html += `
            <section class="text-block">
                <div class="text-block-header">
                    <h2>${content.title}</h2>
                    <div class="text-block-meta">
                        <span class="modified-date">修改于 ${modifiedDate}</span>
                    </div>
                </div>
                <div class="${content.type}">
                    ${contentHtml}
                </div>
                <div class="text-block-actions">
                    <button class="btn btn-copy" onclick="copyText('${encodedContent}', '${content.type}')">复制</button>
                    ${downloadButton}
                    <button class="btn btn-edit" onclick="editContent(${content.id})">编辑</button>
                    <button class="btn btn-delete" onclick="deleteContent(${content.id})">删除</button>
                </div>
            </section>
        `;
    });

    contentContainer.innerHTML = html;
    Prism.highlightAll();
}

// 删除内容函数
window.deleteContent = async function(id) {
    const confirmed = await showConfirmDialog(
        '确认删除',
        '确定要删除这条内容吗？此操作无法撤销。'
    );
    
    if (confirmed) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '删除失败');
            }
            
            contentCache = contentCache.filter(item => item.id !== id);
            renderContents(contentCache);
            showToast('删除成功！');
        } catch (error) {
            console.error('删除失败:', error);
            showToast(error.message, 'error');
        }
    }
}

// 类型切换函数
window.handleTypeChange = function(type) {
    const contentGroup = document.getElementById('contentGroup');
    const imageGroup = document.getElementById('imageGroup');
    const fileGroup = document.getElementById('fileGroup');
    const editContent = document.getElementById('editContent');
    const editImage = document.getElementById('editImage');
    const editFile = document.getElementById('editFile');
    const titleInput = document.getElementById('editTitle');
    const titleGroup = document.getElementById('titleGroup');

    contentGroup.style.display = 'none';
    imageGroup.style.display = 'none';
    fileGroup.style.display = 'none';
    titleGroup.style.display = 'block';
    editContent.required = false;
    editImage.required = false;
    editFile.required = false;
    titleInput.required = true;

    if (type === 'image') {
        imageGroup.style.display = 'block';
        editImage.required = true;
        titleGroup.style.display = 'none';
        titleInput.required = false;
    } else if (type === 'file') {
        fileGroup.style.display = 'block';
        editFile.required = true;
        titleGroup.style.display = 'none';
        titleInput.required = false;
    } else {
        contentGroup.style.display = 'block';
        editContent.required = true;
    }
}

// 编辑内容函数
window.editContent = function(id) {
    const content = contentCache.find(item => item.id === id);
    if (!content) return;

    const form = document.createElement('form');
    form.className = 'edit-form';
    form.innerHTML = `
        <div class="form-group">
            <label for="edit-title">标题</label>
            <input type="text" id="edit-title" value="${content.title}" required>
        </div>
        <div class="form-group">
            <label for="edit-type">类型</label>
            <select id="edit-type">
                <option value="text" ${content.type === 'text' ? 'selected' : ''}>普通文本</option>
                <option value="code" ${content.type === 'code' ? 'selected' : ''}>代码</option>
                <option value="poetry" ${content.type === 'poetry' ? 'selected' : ''}>诗歌</option>
            </select>
        </div>
        <div class="form-group">
            <label for="edit-content">内容</label>
            <textarea id="edit-content" required>${content.content}</textarea>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-cancel" onclick="cancelEdit()">取消</button>
            <button type="submit" class="btn btn-save">保存</button>
        </div>
    `;

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

// DOM元素
document.addEventListener('DOMContentLoaded', () => {
    contentContainer = document.getElementById('content-container');
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
        if (addNewBtn) {
            addNewBtn.className = 'btn add-new-content';
            addNewBtn.addEventListener('click', () => openModal());
        }
        editForm.addEventListener('submit', handleFormSubmit);
        editImage.addEventListener('change', handleImagePreview);
    }

    // 处理图片预览和标题
    function handleImagePreview(event) {
        const file = event.target.files[0];
        if (file) {
            // 立即设置标题
            const titleInput = document.getElementById('editTitle');
            titleInput.value = file.name;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${e.target.result}" alt="预览">`;
            };
            reader.readAsDataURL(file);
        }
    }

    // 处理文件选择和标题
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            // 立即设置标题
            const titleInput = document.getElementById('editTitle');
            titleInput.value = file.name;
            
            // 更新文件信息显示
            const fileInfo = document.querySelector('.file-info');
            const fileIcon = getFileIcon(file.type);
            fileInfo.innerHTML = `
                <div class="file-preview">
                    <i class="file-icon ${fileIcon}"></i>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-type">${getFileTypeDescription(file.type)}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
            `;
        }
    }

    // 开始更新检查
    function startUpdateCheck() {
        updateCheckInterval = setInterval(() => loadContents(false), 4000); // 每4秒静默更新
    }

    // 加载有内容
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
                
                if (!imageFile && existingContent) {
                    content = existingContent;
                } else if (imageFile) {
                    // 确保设置标题
                    if (!title) {
                        document.getElementById('editTitle').value = imageFile.name;
                    }
                    
                    const formData = new FormData();
                    formData.append('image', imageFile);
                    
                    const uploadResponse = await fetch(IMAGES_API_URL, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        throw new Error(errorData.error || '图片上传失败');
                    }
                    
                    const { url } = await uploadResponse.json();
                    content = url;
                } else {
                    throw new Error('请选择图片文件');
                }
            } else if (type === 'file') {
                const file = document.getElementById('editFile').files[0];
                const existingContent = document.getElementById('editContent').value;
                
                if (!file && existingContent) {
                    content = existingContent;
                } else if (file) {
                    // 确保设置标题
                    if (!title) {
                        document.getElementById('editTitle').value = file.name;
                    }
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const uploadResponse = await fetch(FILES_API_URL, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        throw new Error(errorData.error || '文件上传失败');
                    }
                    
                    const { url } = await uploadResponse.json();
                    content = url;
                } else {
                    throw new Error('请选择文件');
                }
            } else {
                content = document.getElementById('editContent').value;
            }

            // 重新获取标题，因为可能在上传过程中被设置
            const finalTitle = document.getElementById('editTitle').value;
            
            if (!type || !finalTitle || !content) {
                throw new Error('请填写所有必要字段');
            }
            
            const formData = { type, title: finalTitle, content };
            
            if (currentEditId) {
                await updateContent(currentEditId, formData);
            } else {
                await createContent(formData);
            }
            
            closeModal();
            await loadContents(false);
            showToast('保存成功！');
        } catch (error) {
            console.error('保存失败:', error);
            showToast(error.message, 'error');
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
            const errorData = await response.json();
            throw new Error(errorData.error || '创建内容失败');
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
            const errorData = await response.json();
            throw new Error(errorData.error || '更新内容败');
        }
        
        return await response.json();
    }
}); 