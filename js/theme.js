// 主题切换功能
function initTheme() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    document.body.appendChild(themeToggle);

    // 从localStorage读取主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // 切换主题
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// 页面加载完成后初始化主题
document.addEventListener('DOMContentLoaded', initTheme); 