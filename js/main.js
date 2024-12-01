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

// 存储已选择的文件
let selectedFiles = new Map();

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
        showToast('准备下载文件...');
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
        
        showToast('文件下载完成');
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
        '确定要删除这条内容吗？此操作无法销。'
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

// 初始化拖拽和粘贴功能
function initializeUploadFeatures() {
    const uploadArea = document.getElementById('uploadArea');
    const selectedFilesDiv = document.getElementById('selectedFiles');
    
    if (!uploadArea || !selectedFilesDiv) {
        console.error('Upload area or selected files container not found');
        return;
    }

    // 初始化文件列表显示
    selectedFilesDiv.style.display = 'none';
    updateFileList();

    // 设置拖放区域事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // 拖放效果
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });

    // 处理文件拖放
    uploadArea.addEventListener('drop', handleDrop, false);

    // 全局粘贴处理
    document.addEventListener('paste', handlePaste, false);
}

// 处理拖拽文件
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        handleFileSelect(e);
    }
}

// 处理粘贴事件
function handlePaste(e) {
    const items = e.clipboardData.items;
    let hasFiles = false;
    let hasText = false;

    // 处理文件
    for (let item of items) {
        if (item.kind === 'file') {
            hasFiles = true;
            const file = item.getAsFile();
            if (file) {
                createFileContent(file);
            }
        } else if (item.type === 'text/plain') {
            hasText = true;
        }
    }

    // 如果有文件被粘贴，显示提示
    if (hasFiles) {
        showPasteIndicator('文件已添加到列表');
    }

    // 如果只有文本内容，则按原来的方式处理
    if (!hasFiles && hasText) {
        for (let item of items) {
            if (item.type === 'text/plain') {
                item.getAsString((text) => {
                    handlePastedText(text);
                });
            }
        }
    }
}

// 处理粘贴的文本
function handlePastedText(text) {
    // 检测是否是代码
    const isCode = detectIfCode(text);
    
    // 如果模态框未打开，则打开它
    if (!document.getElementById('editModal').classList.contains('show')) {
        openModal();
    }

    // 设置类型和内容
    document.getElementById('editType').value = isCode ? 'code' : 'text';
    document.getElementById('editContent').value = text;
    
    // 如果是代码，可以尝试检测语言类型
    if (isCode) {
        const language = detectCodeLanguage(text);
        // 这里可以添加语言选择的逻辑
    }

    showPasteIndicator(isCode ? '已粘贴代码内容' : '已粘贴文本内容');
}

// 检测是否是代码
function detectIfCode(text) {
    // 简单的代码检测规则
    const codeIndicators = [
        /^(function|class|import|export|const|let|var|if|for|while)\s/m,  // 关键字开头
        /[{}\[\]()];$/m,  // 以分隔符结尾的行
        /^\s*(public|private|protected)\s/m,  // 访问修饰符
        /^\s*@\w+/m,  // 装饰器
        /\s{2,}[\w$_]/m,  // 缩进
        /<\/?[a-z][\s\S]*>/i,  // HTML标签
    ];

    return codeIndicators.some(pattern => pattern.test(text));
}

// 显示粘贴提示
function showPasteIndicator(message) {
    // 移除已有的提示
    const existingIndicator = document.querySelector('.paste-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    const indicator = document.createElement('div');
    indicator.className = 'paste-indicator';
    indicator.textContent = message;
    document.body.appendChild(indicator);

    // 2秒后自动移除提示
    setTimeout(() => {
        indicator.remove();
    }, 2000);
}

// 处理文件上传
function handleFiles(files) {
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            // 处理图片文件
            const reader = new FileReader();
            reader.onload = (e) => {
                if (!document.getElementById('editModal').classList.contains('show')) {
                    openModal();
                }
                document.getElementById('editType').value = 'image';
                handleTypeChange('image');
                
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${e.target.result}" alt="预览图片">`;
                
                // 可以在这里添加自动生成标题的逻辑
                if (!document.getElementById('editTitle').value) {
                    document.getElementById('editTitle').value = file.name;
                }
            };
            reader.readAsDataURL(file);
        } else {
            // 处理其他类型文件
            if (!document.getElementById('editModal').classList.contains('show')) {
                openModal();
            }
            document.getElementById('editType').value = 'file';
            handleTypeChange('file');
            handleFileSelect({ target: { files: [file] } });
        }
    }
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
    initializeUploadFeatures();

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

    // 处理文件选择
    function handleFileSelect(event) {
        const files = event.target.files || event.dataTransfer.files;
        if (!files || files.length === 0) return;

        // 关闭当前模态框
        closeModal();

        // 为每个文件创建独立的内容卡片
        Array.from(files).forEach(file => {
            createFileContent(file);
        });

        // 清空input以允许重复选择相同文件
        if (event.target.tagName === 'INPUT') {
            event.target.value = '';
        }
    }

    // 创建文件内容卡片
    function createFileContent(file) {
        const id = generateId();
        const content = {
            id: id,
            type: 'file',
            title: file.name,
            file: file,
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString()
        };

        // 添加到内容缓存
        contentCache.push(content);

        // 创建并显示内容卡片
        const card = createContentCard(content);
        contentContainer.insertBefore(card, contentContainer.firstChild);

        // 保存到本地存储
        saveContents();
    }

    // 更新文件列表显示
    function updateFileList() {
        const selectedFilesDiv = document.getElementById('selectedFiles');
        const fileList = selectedFilesDiv.querySelector('.file-list');
        
        // 确保文件列表元素存在
        if (!fileList) {
            console.error('File list element not found');
            return;
        }

        // 清空当前列表
        fileList.innerHTML = '';

        // 如果没有文件，显示提示信息
        if (selectedFiles.size === 0) {
            fileList.innerHTML = '<li class="no-files">暂无选择的文件</li>';
            return;
        }

        // 添加所有文件到列表
        selectedFiles.forEach((file, fileId) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="file-info-block">
                    <div class="file-icon">${getFileIcon(file.type)}</div>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button type="button" class="file-remove" onclick="removeFile('${fileId}')">删除</button>
            `;
            fileList.appendChild(li);
        });

        // 更新文件信息提示
        const fileInfo = document.querySelector('.file-info');
        if (fileInfo) {
            const count = selectedFiles.size;
            fileInfo.textContent = count > 0 ? 
                `已选择 ${count} 个文件` : 
                '支持所有类型的文件';
        }

        // 显示文件列表区域
        selectedFilesDiv.style.display = selectedFiles.size > 0 ? 'block' : 'none';
    }

    // 获取文件图标
    function getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return '📷';
        if (fileType.startsWith('video/')) return '🎥';
        if (fileType.startsWith('audio/')) return '🎵';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word')) return '📝';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
        if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '📦';
        return '📄';
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 移除文件
    function removeFile(fileId) {
        if (selectedFiles.has(fileId)) {
            selectedFiles.delete(fileId);
            updateFileList();
            showPasteIndicator('文件已移除');
        }
    }

    // 清空文件列表
    function clearFiles() {
        selectedFiles.clear();
        updateFileList();
        // 清空文件输入框
        document.getElementById('editFile').value = '';
        showPasteIndicator('文件列表已清空');
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

    // 创建内容卡片
    function createContentCard(content) {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.dataset.id = content.id;

        if (content.type === 'file') {
            // 获取文件图标
            const fileIcon = getFileIcon(content.file.type);
            
            // 格式化文件大小
            const fileSize = formatFileSize(content.file.size);

            card.innerHTML = `
                <div class="card-header">
                    <div class="file-info-block">
                        <div class="file-icon">${fileIcon}</div>
                        <div class="file-details">
                            <h3 class="file-name">${content.title}</h3>
                            <div class="file-meta">
                                <span class="file-size">${fileSize}</span>
                                <span class="file-type">${getFileTypeDescription(content.file.type)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-download" onclick="downloadFile('${content.id}')">下载</button>
                        <button class="btn btn-edit" onclick="editContent('${content.id}')">编辑</button>
                        <button class="btn btn-delete" onclick="deleteContent('${content.id}')">删除</button>
                    </div>
                </div>
            `;
        }

        return card;
    }

    // 获取文件类型描述
    function getFileTypeDescription(mimeType) {
        const types = {
            'image/': '图片',
            'video/': '视频',
            'audio/': '音频',
            'text/': '文本',
            'application/pdf': 'PDF文档',
            'application/msword': 'Word文档',
            'application/vnd.ms-excel': 'Excel表格',
            'application/zip': '压缩文件'
        };

        for (let type in types) {
            if (mimeType.startsWith(type)) {
                return types[type];
            }
        }

        return '文件';
    }

    // 下载文件
    function downloadFile(id) {
        const content = contentCache.find(item => item.id === id);
        if (content && content.file) {
            const url = URL.createObjectURL(content.file);
            const a = document.createElement('a');
            a.href = url;
            a.download = content.title;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    // 模态框相关函数
    function openModal(id = null) {
        const modal = document.getElementById('editModal');
        const form = document.getElementById('editForm');
        
        // 重置表单
        form.reset();
        
        // 清空文件列表
        selectedFiles.clear();
        updateFileList();

        // 如果是编辑模式
        if (id) {
            const content = contentCache.find(item => item.id === id);
            if (content) {
                document.getElementById('editId').value = content.id;
                document.getElementById('editType').value = content.type;
                document.getElementById('editTitle').value = content.title;
                
                if (content.type === 'file') {
                    handleTypeChange('file');
                    if (content.file) {
                        const fileId = `${content.file.name}-${content.file.lastModified}`;
                        selectedFiles.set(fileId, content.file);
                        updateFileList();
                    }
                } else {
                    document.getElementById('editContent').value = content.content || '';
                    handleTypeChange(content.type);
                }
            }
        } else {
            // 新建模式
            document.getElementById('editId').value = '';
            handleTypeChange('text'); // 默认选择文本类型
        }

        // 显示模态框
        modal.style.display = 'block';
        modal.classList.add('show');

        // 添加关闭事件
        modal.onclick = function(event) {
            if (event.target === modal) {
                closeModal();
            }
        };
    }

    function closeModal() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // 处理表单提交
    function handleFormSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const id = document.getElementById('editId').value;
        const type = document.getElementById('editType').value;
        const title = document.getElementById('editTitle').value;
        
        let content;
        
        if (type === 'file') {
            // 处理文件类型
            if (selectedFiles.size === 0) {
                showMessage('请选择文件');
                return;
            }
            
            // 获取第一个文件（如果有多个文件，创建多个内容）
            selectedFiles.forEach((file, fileId) => {
                createFileContent(file);
            });
        } else {
            // 处理其他类型
            content = document.getElementById('editContent').value;
            
            if (!content) {
                showMessage('请输入内容');
                return;
            }
            
            // 创建或更新内容
            if (id) {
                // 更新现有内容
                const index = contentCache.findIndex(item => item.id === id);
                if (index !== -1) {
                    contentCache[index] = {
                        ...contentCache[index],
                        type,
                        title,
                        content,
                        updateTime: new Date().toISOString()
                    };
                    
                    // 更新显示
                    const card = document.querySelector(`.content-card[data-id="${id}"]`);
                    if (card) {
                        card.replaceWith(createContentCard(contentCache[index]));
                    }
                }
            } else {
                // 创建新内容
                const newContent = {
                    id: generateId(),
                    type,
                    title,
                    content,
                    createTime: new Date().toISOString(),
                    updateTime: new Date().toISOString()
                };
                
                contentCache.unshift(newContent);
                const card = createContentCard(newContent);
                contentContainer.insertBefore(card, contentContainer.firstChild);
            }
        }
        
        // 保存到本地存储
        saveContents();
        
        // 关闭模态框
        closeModal();
        
        // 显示成功消息
        showMessage('保存成功');
    }

    // 显示消息提示
    function showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // 初始化事件监听
    document.addEventListener('DOMContentLoaded', () => {
        // 初始化表单提交事件
        const form = document.getElementById('editForm');
        form.addEventListener('submit', handleFormSubmit);

        // 初始化添加新内容按钮
        const addNewBtn = document.getElementById('addNewBtn');
        addNewBtn.addEventListener('click', () => openModal());

        // 初始化文件上传功能
        initializeUploadFeatures();
    });
}); 