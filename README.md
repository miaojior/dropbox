# Drop中转站

Drop中转站是一个基于 Cloudflare Pages 的多功能内容分享平台，支持文本、代码、诗歌、图片和文件的在线分享和存储。

部署教程：看博客[https://git-blog-share.1143520.xyz/posts/cf-drop-paste.pdf](https://git-blog-share.1143520.xyz/posts/cf-drop-paste.pdf)

密码验证和Telegram通知功能：看下面设置变量

## 功能特点

- 多种内容类型支持：
  - 普通文本：支持markdown格式
  - 代码：自动语法高亮
  - 诗歌：优雅排版展示
  - 图片：支持预览和下载
  - 文件：支持所有类型文件的上传和下载
- 美观的界面设计：
  - 响应式布局，完美适配手机和电脑
  - 优雅的中文字体渲染
  - 简洁现代的界面风格
  - 支持深色/浅色主题切换
- 便捷的操作体验：
  - 一键添加新内容
  - 拖拽上传文件
  - 实时预览效果
  - 快速编辑和删除
- 安全特性：
  - 可选的密码保护
  - 密码验证有效期15天
  - 未验证时内容模糊显示
- Telegram 通知：
  - 可选的 Telegram 群组通知
  - 支持文本、图片、文件等多种类型
  - 美观的 HTML 格式消息
  - 自动同步所有新上传内容

## Markdown 支持

本站支持完整的 Markdown 语法，包括：

1. **基础语法**：
   - 标题（H1-H6）
   - 粗体、斜体
   - 有序/无序列表
   - 引用块
   - 代码块和行内代码
   - 链接和图片
   - 水平分割线

2. **扩展语法**：
   - 表格
   - 任务列表
   - 删除线
   - 脚注
   - 上标和下标
   - Emoji 表情 :smile:

3. **代码高亮**：
   ```javascript
   console.log('支持多种编程语言的语法高亮');
   ```

4. **数学公式**：
   - 行内公式：$E=mc^2$
   - 块级公式：
     $$
     \frac{n!}{k!(n-k)!} = \binom{n}{k}
     $$

## 密码保护功能

### 设置密码保护

1. 在 Cloudflare Pages 的环境变量中设置：
   - 变量名：`ACCESS_PASSWORD`
   - 变量值：你想设置的密码
   - 设置位置：Cloudflare Dashboard > Pages > 你的项目名 > Settings > Environment variables

2. 密码保护特性：
   - 未设置 `ACCESS_PASSWORD` 时默认无密码保护
   - 密码验证成功后有效期为15天
   - 验证有效期存储在浏览器本地存储中
   - 切换浏览器或清除浏览器数据需重新验证

3. 安全提示：
   - 密码验证在前端进行，适用于简单的访问控制
   - 不建议存储高度敏感的信息
   - 如需更高安全性，建议使用专业的加密存储服务

### Telegram 通知功能

1. 配置方法：
   在 Cloudflare Pages 的环境变量中设置：
   - `TG_BOT_TOKEN`: 你的 Telegram Bot Token
   - `TG_CHAT_ID`: 你的 Telegram 群组 ID
   - 设置位置：同上

2. 功能特性：
   - 未设置变量时默认不发送通知
   - 支持 HTML 格式的富文本消息
   - 自动处理消息长度限制（最大4096字符）
   - 代码内容保持格式化显示

3. 通知类型：

   a. 新内容上传：
   ```
   新[类型]上传

   标题: xxx
   内容/链接: xxx
   ```

   b. 内容更新：
   ```
   内容已更新

   标题: xxx
   内容/链接: xxx

   此内容已被编辑
   ```

   c. 内容删除：
   ```
   🗑 内容已删除

   类型: xxx
   标题: xxx

   此内容已被永久删除
   ```

   d. 清空所有内容：
   ```
   🗑 内容已全部清空

   清空内容:
   - 数据库记录: xx 条
   - 图片文件: xx 个
   - 其他文件: xx 个

   所有内容已被永久删除
   ```

4. 内容展示特点：
   - 文本内容：直接显示文本
   - 代码：使用 `<pre><code>` 格式化显示
   - 图片：显示可访问的链接
   - 文件：显示下载链接
   - 超长内容自动截断并添加提示

5. 使用提示：
   - Bot 需要已被添加到目标群组
   - Bot 需要具有发送消息的权限
   - 群组 ID 必须为数字格式
   - 建议先在测试群组中验证功能

6. 安全提示：
   - 不要在消息中包含敏感信息
   - Bot Token 不要泄露给他人
   - 可以限制 Bot 的权限
   - 建议使用私有群组

7. 消息格式说明：
   - 标题使用粗体 `<b>` 标签
   - 说明文字使用斜体 `<i>` 标签
   - 代码使用 `<pre><code>` 标签
   - 支持基本的 HTML 格式化
   - 支持 emoji 表情符号

8. 调试建议：
   - 检查环境变量是否正确设置
   - 确认 Bot 是否在群组中
   - 查看 Cloudflare Pages 的日志
   - 测试不同类型内容的通知效果

### 企业微信机器人通知功能

1. 配置方法：
   在 Cloudflare Pages 的环境变量中设置：
   - `WECOM_BOT_URL`: 企业微信机器人的完整 Webhook 地址
   - 设置位置：Cloudflare Dashboard > Pages > 你的项目名 > Settings > Environment variables

2. 功能特性：
   - 未设置变量时默认不发送通知
   - 使用纯文本格式，适合在手机端查看
   - 自动处理消息长度限制（最大2048字符）
   - 使用 emoji 让消息更生动

3. 通知类型：

   新内容上传：
   ```
   📝 新内容上传

   📌 标题: xxx

   💬 内容:

   这是内容文本
   ```

   或者对于图片/文件：
   ```
   🖼️ 新图片上传

   📌 标题: xxx

   🔗 链接: https://example.com/image.jpg
   ```

4. 内容展示特点：
   - 文本内容：直接显示文本
   - 代码：作为纯文本显示
   - 图片：显示可访问的链接
   - 文件：显示下载链接
   - 超长内容自动截断并添加省略号

5. 使用提示：
   - 需要先在企业微信群中添加机器人
   - 复制机器人的 Webhook 地址
   - 建议先在测试群组中验证功能

6. 安全提示：
   - Webhook 地址不要泄露给他人
   - 建议使用私有群组
   - 定期更新 Webhook 地址

7. 消息格式说明：
   - 使用 emoji 标识不同类型的内容
   - 每个部分之间有空行分隔
   - 保持简洁清晰的格式

8. 调试建议：
   - 检查环境变量是否正确设置
   - 确认 Webhook 地址是否有效
   - 查看 Cloudflare Pages 的日志
   - 测试不同类型内容的通知效果

## 技术架构

- 前端：
  - HTML5 + CSS3 + JavaScript
  - Prism.js 用于代码高亮
  - Markdown-it 用于 Markdown 渲染
  - Medium-zoom 用于图片预览
- 后端：
  - Cloudflare Pages 托管静态资源
  - Cloudflare Workers 处理动态请求
  - Cloudflare D1 SQLite 数据库存储内容
  - Cloudflare KV 存储图片和文件
- 核心功能：
  - 数据库表结构自动创建和管理
  - 文件和图片的 KV 存储管理
  - CORS 跨域支持
  - 可选的密码保护功能
  - 可选的 Telegram 通知集成
  - 高效的缓存和内存管理机制

## 缓存和内存管理

1. **内容缓存机制**：
   - 使用 localStorage 存储内容缓存
   - 缓存有效期为15天
   - 缓存包含完整的内容数据
   - 自动检测内容更新并刷新缓存

2. **同步间隔设置**：
   - 默认同步间隔为30秒
   - 同步间隔配置缓存在 localStorage
   - 同步间隔缓存有效期为7天
   - 支持服务端配置自定义同步间隔

3. **密码验证缓存**：
   - 密码验证状态缓存15天
   - 使用 localStorage 存储验证状态
   - 包含验证时间和过期时间
   - 自动检查验证状态有效性

4. **内存管理优化**：
   - 维护内存中的内容缓存数组
   - 记录最后更新时间戳
   - 定期检查内容更新
   - 页面不可见时暂停同步
   - 页面可见时恢复同步
   - 浏览器关闭前自动清理

5. **性能优化策略**：
   - 避免频繁的服务器请求
   - 优先使用本地缓存数据
   - 增量更新变化的内容
   - 智能的缓存过期处理
   - 按需加载和更新数据

## 项目结构

```
.
├── index.html                    # 主页面
├── css/                         # 样式文件
│   └── style.css               # 主样式文件
├── js/                         # JavaScript文件
│   ├── main.js                # 主逻辑文件
│   └── theme.js               # 主题切换功能
├── functions/                  # Cloudflare Functions
│   ├── _middleware.js         # 中间件：数据库初始化和CORS
│   ├── _telegram.js          # Telegram 通知功能
│   ├── _vars/               # 环境变量访问
│   │   └── [name].js       # 环境变量获取API
│   ├── contents.js          # 内容列表管理
│   ├── contents/           # 内容详细操作
│   │   └── [id].js        # 单个内容的CRUD
│   ├── images.js          # 图片上传和列表
│   ├── images/           # 图片详细操作
│   │   └── [name].js    # 单个图片的处理
│   ├── files.js         # 文件管理
│   ├── files/          # 文件详细操作
│   │   ├── upload.js  # 文件上传处理
│   │   └── [name].js  # 单个文件的处理
│   └── clear-all.js   # 清空所有数据
├── _routes.json       # API路由配置
└── package.json      # 项目配置和依赖
```

### 关键文件说明

1. **核心配置文件**:
   - `_routes.json`: 定义所有API路由和访问权限
   - `package.json`: 项目依赖和命令配置

2. **前端文件**:
   - `index.html`: 主页面和UI组件
   - `style.css`: 样式定义，包括深色模式
   - `main.js`: 主要业务逻辑
   - `theme.js`: 主题切换功能

3. **后端功能**:
   - `_middleware.js`: 
     - 数据库初始化
     - 表结构创建
     - CORS 处理
   - `_telegram.js`:
     - Telegram 消息格式化
     - 通知发送逻辑
   - `contents.js` 和 `contents/[id].js`:
     - 内容的增删改查
     - 数据库操作
   - `images.js` 和 `files.js`:
     - 文件上传处理
     - KV 存储管理
   - `clear-all.js`:
     - 数据清理
     - 存储空间管理

## 使用教程

### 1. 添加新内容

1. 点击页面顶部的"添加新内容"按钮
2. 在弹出的对话框中选择内容类型：
   - 普通文本：直接输入或粘贴文本内容
   - 代码：输入代码，支持自动语法高亮
   - 诗歌：按诗歌格式排版输入
   - 图片：点击上传或拖拽图片文件
   - 文件：点击上传或拖拽任意类型文件
3. 填写标题
4. 点击"保存"按钮完成添加

### 2. 编辑内容

1. 找到要编辑的内容卡片
2. 点击右上角的编辑图标
3. 在弹出的对话框中修改内容
4. 点击"保存"保存修改

### 3. 删除内容

1. 找到要删除的内容卡片
2. 点击右上角的删除图标
3. 确认删除操作

### 4. 下载文件/图片

1. 找到要下载的文件/图片卡片
2. 点击下载图标或文件名即可下载

## 部署教程

### 1. 准备工作

1. 注册 Cloudflare 账号
2. 安装 Node.js 和 npm
3. 安装 Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```

### 2. 本地开发

1. 克隆项目：
   ```bash
   git clone <项目地址>
   cd dropbox
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境：
   ```bash
   # 登录到 Cloudflare
   wrangler login
   
   # 创建 D1 数据库
   wrangler d1 create drop-db
   
   # 创建 KV 命名空间
   wrangler kv:namespace create IMAGES
   wrangler kv:namespace create FILES
   ```

4. 初始化数据库：
   ```bash
   wrangler d1 execute drop-db --file=./schema.sql
   ```

5. 启动开发服务器：
   ```bash
   npm run dev
   ```

### 3. 部署到生产环境

1. 在 Cloudflare Pages 中创建新项目
2. 连接 GitHub 仓库
3. 配置构建设置：
   - 构建命令：`npm run build`
   - 输出目录：`/`
4. 配置环境变量：
   - `DB`: D1 数据库绑定
   - `IMAGES`: KV 命名空间绑定
   - `FILES`: KV 命名空间绑定
   - `SYNC_INTERVAL`: 内容同步间隔（毫秒），例如：
     - 30秒：设置为 `30000`
     - 1分钟：设置为 `60000`
     - 5分钟：设置为 `300000`
     - 注意：最小值为5000（5秒）
5. 部署：
   ```bash
   npm run deploy
   ```

### 4. 配置说明

#### 同步间隔设置
- 默认值：30秒（30000毫秒）
- 修改方法：在 Cloudflare Pages 的环境变量中设置 `SYNC_INTERVAL`
- 设置位置：Cloudflare Dashboard > Pages > 你的项目 > Settings > Environment variables
- 生效时间：修改后用户刷新页面即可生效
- 注意事项：
  - 值必须大于等于5000（5秒）
  - 较短的同步间隔会增加API请求频率
  - 建议根据实际需求和免费额度（10万次/天）合理设置
  - 计算公式：`(24小时 * 3600秒) / (同步间隔数) = 每天请求次数/用户`

## 常见问题

1. **Q: 上传文件大小有限制吗？**
   A: 是的，单个文件最大支持 25MB。

2. **Q: 支持哪些代码语言的高亮？**
   A: 支持所有主流编程语言，包括但不限于：JavaScript、Python、Java、C++、Go等。

3. **Q: 如何备份数据？**
   A: 可以通过 Cloudflare D1 的导出功能备份数据库，KV 存储的文件需要单独下载备份。

## 技术支持

如果遇到问题或需要帮助，可以：
1. 提交 GitHub Issue
2. 查看 Cloudflare 官方文档
3. 参考代码注释

## 开源协议

本项目采用 MIT 协议开源。

## CDN 配置说明

本项目使用了多个 CDN 来加载外部资源，主要包括以下几个：

### 1. JSD 镜像（jsd.cdn.zzko.cn）
主要用于加载 Prism.js 核心文件：
```html
<script src="https://jsd.cdn.zzko.cn/npm/prismjs@1.29.0/prism.min.js"></script>
```

### 2. Zstatic CDN（s4.zstatic.net）
用于加载大部分 JavaScript 库和 CSS 文件：

```html
<!-- Prism.js 样式和组件 -->
<link rel="stylesheet" href="https://s4.zstatic.net/npm/prismjs@1.29.0/themes/prism.min.css">
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-core.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-clike.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-markup-templating.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-markup.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-css.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-javascript.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-python.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-java.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-c.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-cpp.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-csharp.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-php.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-sql.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-bash.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-json.min.js"></script>
<script src="https://s4.zstatic.net/npm/prismjs@1.29.0/components/prism-markdown.min.js"></script>

<!-- Markdown-it 及其插件 -->
<script src="https://s4.zstatic.net/npm/markdown-it/dist/markdown-it.min.js"></script>
<script src="https://s4.zstatic.net/npm/markdown-it-emoji/dist/markdown-it-emoji.min.js"></script>
<script src="https://s4.zstatic.net/npm/markdown-it-sub/dist/markdown-it-sub.min.js"></script>
<script src="https://s4.zstatic.net/npm/markdown-it-sup/dist/markdown-it-sup.min.js"></script>
<script src="https://s4.zstatic.net/npm/markdown-it-footnote/dist/markdown-it-footnote.min.js"></script>
<script src="https://s4.zstatic.net/npm/markdown-it-task-lists/dist/markdown-it-task-lists.min.js"></script>

<!-- Medium-zoom 图片预览 -->
<script src="https://s4.zstatic.net/npm/medium-zoom/dist/medium-zoom.min.js"></script>
```

### CDN 切换说明

如果需要切换 CDN 源，可以考虑以下备选方案：

1. **jsDelivr**
```html
<!-- 示例：切换到 jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
```

2. **UNPKG**
```html
<!-- 示例：切换到 UNPKG -->
<script src="https://unpkg.com/prismjs@1.29.0/prism.min.js"></script>
```

3. **cdnjs**
```html
<!-- 示例：切换到 cdnjs -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
```

### CDN 选择建议

1. **国内访问**：
   - 优先使用南科大镜像或 Zstatic
   - 备选：字节跳动静态资源公共库

2. **国外访问**：
   - 优先使用 jsDelivr 或 cdnjs
   - 备选：UNPKG

3. **自定义域名**：
   - 可以使用 Cloudflare Workers 自建 CDN
   - 支持自定义缓存策略和访问控制

4. **注意事项**：
   - 建议保留多个备用 CDN 源
   - 可以通过 JavaScript 动态检测 CDN 可用性
   - 关键资源建议本地部署备份