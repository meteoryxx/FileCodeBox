# FileCodeBox 项目概览

## 项目简介

FileCodeBox 是一个基于 FastAPI + Vue3 开发的轻量级文件分享工具。它允许用户通过简单的方式分享文本和文件，接收者只需要一个提取码就可以取得文件，就像从快递柜取出快递一样简单。

## 技术栈

- 后端: Python 3.8+, FastAPI, Tortoise-ORM, SQLite
- 前端: Vue 3, Element Plus
- 部署: Docker (支持), Uvicorn

## 核心功能

1.  **文件/文本分享**: 用户可以上传文件或分享文本内容，系统会生成一个唯一的提取码。
2.  **提取码机制**: 通过提取码获取分享的内容，支持设置过期时间和使用次数。
3.  **多种存储后端**: 支持本地存储、S3兼容对象存储、OneDrive、WebDAV等多种存储方式。
4.  **管理后台**: 提供管理员界面用于文件管理、系统配置等。
5.  **安全机制**: 包含IP限制上传次数、错误次数限制、文件过期机制等。
6.  **响应式设计**: 前端支持移动端访问。
7.  **多主题支持**: 提供多套前端主题。

## 项目结构

```
FileCodeBox/
├── apps/           # 应用代码
│   ├── admin/      # 管理后台相关
│   └── base/       # 基础功能（分享、文件处理等）
├── core/           # 核心功能（配置、数据库、存储、任务等）
├── data/           # 数据目录（SQLite数据库、上传文件等）
├── themes/         # 前端主题文件
├── main.py         # 应用入口文件
├── requirements.txt # Python依赖
└── ...             # 配置文件、文档等
```

## 启动与部署

### 开发环境启动

1.  **后端**:
    ```bash
    pip install -r requirements.txt
    python main.py
    ```
2.  **前端**: 前端代码在独立仓库中，需要单独克隆和构建。

### Docker 部署

```bash
docker run -d --restart=always -p 12345:12345 -v /opt/FileCodeBox/:/app/data --name filecodebox lanol/filecodebox:beta
```

或使用 `docker-compose.yml` 文件进行部署。

## 开发约定

- 后端使用 FastAPI 框架，遵循其路由和依赖注入模式。
- 数据库使用 Tortoise-ORM 进行异步操作。
- 配置通过 `core/settings.py` 进行管理，支持运行时修改。
- 文件存储通过 `core/storage.py` 中定义的接口实现，便于扩展新的存储后端。
- 前端与后端通过 RESTful API 进行交互。

## 关键配置项

- `file_storage`: 指定文件存储后端 (local, s3, onedrive, webdav, opendal)。
- `uploadSize`: 上传文件大小限制。
- `expireStyle`: 可选的过期时间类型。
- `admin_token`: 管理员登录密码。
- 各种存储后端的具体配置项 (如 S3 的 access key, OneDrive 的认证信息等)。