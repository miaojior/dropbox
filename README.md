# 优雅的文本展示网页

这是一个部署在Cloudflare Pages上的静态网页项目，用于优雅地展示各种文本内容，包括代码、中文文本、诗歌等。

## 功能特点

- 支持多种文本格式的展示
- 代码高亮显示
- 优雅的中文字体渲染
- 响应式设计，适配各种设备
- 简洁现代的界面设计

## 项目结构

```
.
├── index.html          # 主页面
├── css/               # 样式文件
│   └── style.css      # 主样式文件
├── js/                # JavaScript文件
│   └── main.js        # 主逻辑文件
└── README.md          # 项目说明文档
```

## 部署说明

本项目可以直接部署到Cloudflare Pages，只需要将代码推送到GitHub仓库，然后在Cloudflare Pages中连接该仓库即可。

## 本地开发

1. 克隆本仓库
2. 使用任意HTTP服务器启动项目（例如：Python的`http.server`或VS Code的Live Server插件）
3. 在浏览器中访问本地服务器地址 