// 播放器状态
let isPlaying = false;
let isCollapsed = false;
let currentTrack = 0;

// 播放器DOM元素
const player = document.querySelector('.song-player');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.querySelector('.progress-bar');
const lyricsContainer = document.querySelector('.lyrics-container');
const playlistPanel = document.querySelector('.playlist-panel');

// 切换播放/暂停
function togglePlay() {
    isPlaying = !isPlaying;
    playPauseBtn.innerHTML = isPlaying ? 
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' :
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
}

// 切换折叠状态
function toggleCollapse() {
    isCollapsed = !isCollapsed;
    player.classList.toggle('collapsed', isCollapsed);
}

// 切换歌词显示
function toggleLyrics() {
    lyricsContainer.classList.toggle('expanded');
    document.getElementById('lyricsBtn').classList.toggle('active');
}

// 切换播放列表显示
function togglePlaylist() {
    playlistPanel.classList.toggle('expanded');
    document.getElementById('playlistBtn').classList.toggle('active');
}

// 上一首
function previousTrack() {
    // 实现上一首逻辑
}

// 下一首
function nextTrack() {
    // 实现下一首逻辑
}

// 更新进度条
function updateProgress(percent) {
    progressBar.style.width = `${percent}%`;
}

// 点击进度条跳转
document.querySelector('.progress').addEventListener('click', function(e) {
    const percent = (e.offsetX / this.offsetWidth) * 100;
    updateProgress(percent);
});

// 初始化播放器
function initPlayer() {
    // 这里可以添加初始化逻辑，比如加载播放列表等
}

// 页面加载完成后初始化播放器
document.addEventListener('DOMContentLoaded', initPlayer); 