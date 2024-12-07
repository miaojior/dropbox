// API配置
const API_BASE_URL = '/contents';
const IMAGES_API_URL = '/images';
const FILES_API_URL = '/files';
const FILES_UPLOAD_URL = '/files/upload';
const DOWNLOAD_API_URL = '/download';

// 密码验证相关
const PASSWORD_VERIFIED_KEY = 'password_verified';
const PASSWORD_VERIFIED_EXPIRY_KEY = 'password_verified_expiry';
const VERIFY_EXPIRY_DAYS = 15;

// 检查密码验证状态
async function checkPasswordProtection() {
    try {
        const response = await fetch('/_vars/ACCESS_PASSWORD');
        // 如果返回 204，说明未设置密码，不需要验证
        if (response.status === 204) {
            return true;
        }
        
        if (!response.ok) {
            console.error('获取密码配置失败:', response.status);
            return true; // 出错时默认允许访问
        }

        const verified = localStorage.getItem(PASSWORD_VERIFIED_KEY);
        const expiry = localStorage.getItem(PASSWORD_VERIFIED_EXPIRY_KEY);
        
        if (verified && expiry && new Date().getTime() < parseInt(expiry)) {
            return true;
        }

        document.getElementById('passwordOverlay').style.display = 'flex';
        document.getElementById('mainContent').classList.add('content-blur');
        document.body.classList.add('password-active');
        return false;
    } catch (error) {
        console.error('检查密码保护失败:', error);
        return true; // 出错时默认允许访问
    }
}

// 验证密码
async function verifyPassword() {
    const passwordInput = document.getElementById('accessPassword');
    const password = passwordInput.value;

    try {
        const response = await fetch('/_vars/ACCESS_PASSWORD');
        if (!response.ok) {
            throw new Error('获取密码失败');
        }

        const correctPassword = await response.text();
        
        if (password === correctPassword) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + VERIFY_EXPIRY_DAYS);
            
            localStorage.setItem(PASSWORD_VERIFIED_KEY, 'true');
            localStorage.setItem(PASSWORD_VERIFIED_EXPIRY_KEY, expiryDate.getTime().toString());
            
            document.getElementById('passwordOverlay').style.display = 'none';
            document.getElementById('mainContent').classList.remove('content-blur');
            document.body.classList.remove('password-active'); // 移除禁止滚动的类
            showToast('验证成功！');
        } else {
            showToast('密码错误！', 'error');
            passwordInput.value = '';
        }
    } catch (error) {
        console.error('密码验证失败:', error);
        showToast('验证失败: ' + error.message, 'error');
    }
}

// 监听回车键
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && document.getElementById('passwordOverlay').style.display !== 'none') {
        verifyPassword();
    }
});

// 全局变量
let currentEditId = null;
let lastUpdateTime = Date.now();
let updateCheckInterval;
let contentCache = [];
let contentContainer;
let syncInterval = 30000; // 默认30秒
let zoomInstance = null; // 追踪灯箱实例

// 获取同步间隔配置
async function getSyncInterval() {
    try {
        const response = await fetch('/_vars/SYNC_INTERVAL');
        if (response.ok) {
            const interval = await response.text();
            // 确保interval是一个有效的数字且不小于5秒
            const parsedInterval = parseInt(interval);
            if (!isNaN(parsedInterval) && parsedInterval >= 5000) {
                syncInterval = parsedInterval;
                console.log('已从环境变量加载同步间隔:', syncInterval, 'ms');
            }
        }
    } catch (error) {
        console.warn('无法获取同步间隔配置，使用默认值:', syncInterval, 'ms');
    }
}

// 工具函数
function getFileIcon(filename) {
    // 获取文件拓展名
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

    // 应用程序文件
    if (ext === 'exe') return 'windows';
    if (ext === 'msi') return 'windows-installer';
    if (ext === 'apk') return 'android';
    if (ext === 'app' || ext === 'dmg') return 'macos';
    if (ext === 'deb' || ext === 'rpm') return 'linux';
    if (['appx', 'msix'].includes(ext)) return 'windows-store';
    if (['ipa', 'pkg'].includes(ext)) return 'ios';

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

    // 应用程序文件
    if (ext === 'exe') return 'Windows可执行程序';
    if (ext === 'msi') return 'Windows安装程序';
    if (ext === 'apk') return 'Android应用程序';
    if (ext === 'app') return 'macOS应用程序';
    if (ext === 'dmg') return 'macOS安装镜像';
    if (ext === 'deb') return 'Debian/Ubuntu安装包';
    if (ext === 'rpm') return 'RedHat/Fedora安装包';
    if (['appx', 'msix'].includes(ext)) return 'Windows商店应用';
    if (ext === 'ipa') return 'iOS应用程序';
    if (ext === 'pkg') return 'macOS安装包';

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
    if (['sh', 'bash'].includes(ext)) return 'Shell文本';
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
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="confirm-dialog-overlay"></div>
            <div class="confirm-dialog">
                <div class="confirm-dialog-content">
                    <div class="confirm-dialog-title">${title}</div>
                    <div class="confirm-dialog-message">${message}</div>
                    <div class="confirm-dialog-buttons">
                        <button class="btn btn-cancel">取消</button>
                        <button class="btn btn-primary">确定</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(wrapper);

        const buttons = wrapper.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                wrapper.remove();
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
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`下载失败: ${response.status} ${response.statusText}`);
        }

        // 获取响应头中的文件名
        const contentDisposition = response.headers.get('content-disposition');
        const match = contentDisposition?.match(/filename="(.+)"/);
        const actualFilename = match ? decodeURIComponent(match[1]) : filename;

        // 使用 streams API 处理大文件下载
        const reader = response.body.getReader();
        const contentLength = response.headers.get('content-length');
        let receivedLength = 0;
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            chunks.push(value);
            receivedLength += value.length;

            // 更新下载进度
            if (contentLength) {
                const progress = ((receivedLength / contentLength) * 100).toFixed(2);
                showToast(`下载进度: ${progress}%`);
            }
        }

        // 合并所有chunks
        const blob = new Blob(chunks);
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = actualFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        showToast('文件下载完成');
    } catch (error) {
        console.error('下载失败:', error);
        showToast('下载失败: ' + error.message, 'error');
    }
}

// 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const beijingDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const year = beijingDate.getFullYear();
    const month = String(beijingDate.getMonth() + 1).padStart(2, '0');
    const day = String(beijingDate.getDate()).padStart(2, '0');
    const hours = String(beijingDate.getHours()).padStart(2, '0');
    const minutes = String(beijingDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 初始化 markdown-it
const md = window.markdownit({
    html: true,        // 启用 HTML 标签
    breaks: true,      // 转换换行符为 <br>
    linkify: true,     // 自动转换 URL 为链接
    typographer: true, // 启用一些语言中性的替换和引号美化
    quotes: ['""', '\'\'']    // 引号样式
}).use(window.markdownitEmoji)                 // 启用表情
    .use(window.markdownitSub)                   // 启用下标
    .use(window.markdownitSup)                   // 启用上标
    .use(window.markdownitFootnote)              // 启用脚注
    .use(window.markdownitTaskLists, {           // 启用任务列表
        enabled: true,
        label: true,
        labelAfter: true
    });

// 初始化灯箱效果
const zoom = mediumZoom('[data-zoomable]', {
    margin: 48,
    background: 'rgba(0, 0, 0, 0.9)',
    scrollOffset: 0,
    container: document.body,
    template: null,
    transition: {
        duration: 400,
        timing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
});

// 自定义图片渲染规则
md.renderer.rules.image = function (tokens, idx, options, env, slf) {
    const token = tokens[idx];
    const src = token.attrGet('src');
    const alt = token.content || '';
    const title = token.attrGet('title') || '';

    return `<img src="${src}" alt="${alt}" title="${title}" loading="lazy" data-zoomable class="zoomable-image">`;
};

// 添加视频链接解析规则
function parseVideoUrl(url) {
    // 普通视频文件扩展名
    const videoExtensions = /\.(mp4|mkv|webm|avi|mov|wmv|flv)$/i;
    if (videoExtensions.test(url)) {
        return {
            type: 'video',
            url: url
        };
    }

    // YouTube（支持普通视频和shorts）
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^?&\s]+)/);
    if (youtubeMatch) {
        return {
            type: 'youtube',
            id: youtubeMatch[1],
            embed: `https://www.youtube.com/embed/${youtubeMatch[1]}`
        };
    }

    // 哔哩哔哩
    const bilibiliMatch = url.match(/(?:bilibili\.com\/video\/)([^?&\s/]+)/);
    if (bilibiliMatch) {
        return {
            type: 'bilibili',
            id: bilibiliMatch[1],
            embed: `//player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&page=1`
        };
    }

    return null;
}

// 自定义链接渲染规则
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const href = token.attrGet('href');

    if (href) {
        const video = parseVideoUrl(href);
        if (video) {
            // 设置标记，告诉 link_close 这是一个视频链接
            token.video = video;
            return ''; // 不渲染开始标签
        }
        // 为普通链接添加新标签页打开属性
        token.attrPush(['target', '_blank']);
        token.attrPush(['rel', 'noopener noreferrer']);
    }

    return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_close = function (tokens, idx, options, env, self) {
    // 检查 idx-2 是否在有效范围内
    if (idx >= 2 && tokens[idx - 2]) {
        const openToken = tokens[idx - 2];
        if (openToken && openToken.video) {
            const video = openToken.video;
            if (video.type === 'youtube') {
                return `<div class="video-container youtube">
                    <iframe src="${video.embed}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>`;
            } else if (video.type === 'bilibili') {
                return `<div class="video-container bilibili">
                    <iframe src="${video.embed}"
                        frameborder="0"
                        allowfullscreen>
                    </iframe>
                </div>`;
            } else if (video.type === 'video') {
                return `<div class="video-container">
                    <video controls preload="metadata" class="native-video">
                        <source src="${video.url}" type="video/mp4">
                        您的浏览器不支持视频播放。
                    </video>
                </div>`;
            }
        }
    }

    return self.renderToken(tokens, idx, options);
};

// 自定义代码块渲染规则
md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
    const token = tokens[idx];
    const code = token.content;
    const lang = token.info || '';
    const highlighted = Prism.highlight(code, Prism.languages[lang] || Prism.languages.plain, lang);

    return `<div class="code-wrapper">
        <pre><code class="language-${lang}">${highlighted}</code></pre>
        <button class="copy-button" onclick="copyCode(this)">复制代码</button>
    </div>`;
};

// 复制代码函数
window.copyCode = function (button) {
    const pre = button.parentElement.querySelector('pre');
    const code = pre.textContent;

    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.textContent;
        button.textContent = '已复制！';
        button.style.background = '#4CAF50';
        button.style.color = 'white';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
            button.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制', 'error');
    });
};

// 加载内容
async function loadContents(showLoading = true) {
    if (!contentContainer) {
        contentContainer = document.getElementById('content-container');
    }

    try {
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

        // 只有当数据发生变化时才重新渲染
        if (JSON.stringify(contentCache) !== JSON.stringify(data)) {
            contentCache = data || [];
            await renderContents(contentCache);  // 等待渲染完成
        }

        lastUpdateTime = Date.now();
    } catch (error) {
        console.error('加载内容失败:', error);
        if (showLoading) {
            showError(`加载内容失败: ${error.message}`);
        }
    }
}

// 检查更新
async function checkForUpdates() {
    await loadContents(false);
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
async function renderContents(contents) {
    if (!contentContainer) return;

    if (!contents || contents.length === 0) {
        contentContainer.innerHTML = '<div class="empty-state">还没有任何内容，快来添加吧！😊</div>';
        return;
    }

    let html = '';
    for (const content of contents) {
        html += await createContentBlock(content);
    }
    contentContainer.innerHTML = html;

    // 初始化代码高亮
    Prism.highlightAll();

    // 初始化图片缩放
    if (zoomInstance) {
        zoomInstance.detach();
    }
    zoomInstance = mediumZoom('.content-image', {
        margin: 20,
        background: 'rgba(0, 0, 0, 0.9)',
    });
}

// 创建内容块
async function createContentBlock(content) {
    const { id, type, title, content: contentData, createdAt, updatedAt } = content;
    const isUpdated = createdAt !== updatedAt;
    const timeText = formatTime(createdAt) + (isUpdated ? ` (已编辑于 ${formatTime(updatedAt)})` : '');

    let contentHtml = '';
    if (type === 'text') {
        contentHtml = `<div class="text-content">${await renderMarkdown(contentData)}</div>`;
    } else if (type === 'code') {
        contentHtml = `
            <div class="code-wrapper">
                <pre><code class="language-javascript">${escapeHtml(contentData)}</code></pre>
                <button class="copy-button" onclick="copyCode(this)">复制</button>
            </div>
        `;
    } else if (type === 'poetry') {
        contentHtml = `<div class="poetry-content">${formatPoetry(contentData)}</div>`;
    } else if (type === 'image') {
        contentHtml = `
            <div class="image-content">
                <img src="${contentData}" alt="${title}" class="content-image">
                <a href="${contentData}" download class="download-link">
                    <button class="btn">
                        <svg viewBox="0 0 24 24" class="btn-icon">
                            <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        下载图片
                    </button>
                </a>
            </div>
        `;
    } else if (type === 'file') {
        const fileName = contentData.split('/').pop();
        const fileIcon = getFileIcon(fileName);
        contentHtml = `
            <div class="file-content">
                <div class="file-info">
                    <i class="file-icon ${fileIcon}"></i>
                    <div class="file-details">
                        <div class="file-name">${fileName}</div>
                        <div class="file-type">${getFileTypeDescription(fileName)}</div>
                    </div>
                </div>
                <a href="${contentData}" download class="download-link">
                    <button class="btn">
                        <svg viewBox="0 0 24 24" class="btn-icon">
                            <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        下载文件
                    </button>
                </a>
            </div>
        `;
    }

    return `
        <section class="text-block" data-id="${id}">
            <div class="text-block-header">
                <h2>${escapeHtml(title)}</h2>
                <div class="text-block-meta">
                    <span class="time">${timeText}</span>
                    <div class="actions">
                        <button onclick="editContent(${id})" class="action-btn edit-btn" title="编辑">
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button onclick="deleteContent(${id})" class="action-btn delete-btn" title="删除">
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            ${contentHtml}
        </section>
    `;
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 7) {
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (days > 0) {
        return `${days}天前`;
    } else if (hours > 0) {
        return `${hours}小时前`;
    } else if (minutes > 0) {
        return `${minutes}分钟前`;
    } else {
        return '刚刚';
    }
}

// 处理图片预览
window.handleImagePreview = function(event) {
    const file = event.target.files[0];
    if (file) {
        // 立即设置标题
        const titleInput = document.getElementById('editTitle');
        if (!titleInput.value || titleInput.value.trim() === '') {
            titleInput.value = file.name;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="预览">`;
        };
        reader.readAsDataURL(file);
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', async function() {
    // 初始化内容容器
    contentContainer = document.getElementById('content-container');

    // 获取同步间隔配置
    await getSyncInterval();

    // 检查密码保护
    const canAccess = await checkPasswordProtection();
    if (!canAccess) return;

    // 加载内容
    await loadContents();

    // 设置定时更新
    updateCheckInterval = setInterval(checkForUpdates, syncInterval);

    // 添加新内容按钮事件
    document.getElementById('addNewBtn').addEventListener('click', () => {
        currentEditId = null;
        document.getElementById('editForm').reset();
        document.getElementById('editModal').style.display = 'block';
        document.getElementById('editTitle').focus();
    });

    // 编辑表单提交事件
    document.getElementById('editForm').addEventListener('submit', handleFormSubmit);

    // 图片预览事件 - 使用已定义的 handleImagePreview 函数
    document.getElementById('editImage').addEventListener('change', handleImagePreview);

    // 返回顶部按钮
    const backToTopButton = document.querySelector('.back-to-top');
    
    // 监听滚动事件
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
    
    // 点击返回顶部
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}); 