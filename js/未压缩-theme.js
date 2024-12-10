// 主题切换功能
function initTheme() {
    // 创建悬停区域
    const hoverArea = document.createElement('div');
    hoverArea.className = 'theme-toggle-hover-area';
    
    // 创建主题切换按钮
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.setAttribute('aria-label', '切换深色模式');
    
    // 将按钮添加到悬停区域中
    hoverArea.appendChild(themeToggle);
    document.body.appendChild(hoverArea);

    // 从localStorage读取主题设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 切换主题
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// 确保DOM加载完成后再初始化主题
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
} 