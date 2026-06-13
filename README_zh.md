# Arc

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/lyon916/Arc/actions/workflows/ci.yml/badge.svg)](https://github.com/lyon916/Arc/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff)](https://vitejs.dev)

**Arc** = **A**PI **R**equest **C**onsole。一款真正能用的浏览器端 API 客户端 — 一键绕过 CORS，无需安装，无需注册，无需后端。

> **在线体验：**[www.arcapi.xyz](https://www.arcapi.xyz) — 打开即用。

[English](./README.md)

## 为什么选 Arc？

浏览器端的 API 工具有个致命缺陷：**跨域限制**。你粘贴一个 URL，点击发送，然后看到 `blocked by CORS policy`。在 Arc 里，点一下 🛡 盾牌图标就搞定 — 所有请求自动走内置代理，立即可用。

| | Arc | Hoppscotch（浏览器） | Postman（网页版） |
|---|---|---|---|
| CORS 绕过 | ✅ 一键开关 | ❌ 需要浏览器扩展 | ❌ 仅桌面端支持 |
| 代理开源 | ✅ [80 行，无日志](./worker/) | — | — |
| 自部署代理 | ✅ Cloudflare Worker | — | — |
| 无需安装 | ✅ | ✅ | ❌ 必须装 App |
| 离线 / 本地优先 | ✅ IndexedDB | ✅ | ❌ 必须登录 |

## 功能特性

- **🛡 内置 CORS 代理** — 一键切换。请求通过开源的 [Cloudflare Worker](./worker/) 转发 — 无日志、无存储，30 秒即可自部署。
- **HTTP 请求构造器** — GET / POST / PUT / DELETE / PATCH / HEAD / OPTIONS，支持 Query Params、Headers、Body（JSON / FormData / Raw）
- **认证方式** — Bearer Token、Basic Auth
- **环境变量** — 多环境 `{{变量名}}` 语法，快速切换
- **集合管理** — 保存和整理请求，支持文件夹分组
- **请求历史** — 自动保存到本地 IndexedDB，可搜索、可撤销
- **cURL 导入** — 粘贴 cURL 命令即可填充请求
- **代码生成** — 导出 JavaScript / TypeScript / cURL 代码片段
- **17 种主题** — Linear Dark、Dracula、Nord、Catppuccin、Solarized、GitHub Light 等
- **国际化** — 中文 / 英文（自动检测浏览器语言）
- **移动端适配** — 完整的底部导航栏布局
- **键盘快捷键** — `Ctrl+Enter` 发送、`Ctrl+S` 保存、`Ctrl+L` 聚焦 URL、`Esc` 取消

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | React 19 |
| 构建 | Vite 6 |
| 语言 | TypeScript |
| 样式 | TailwindCSS 4 + DaisyUI 5 |
| 状态管理 | Zustand 5 |
| 存储 | Dexie 4（IndexedDB） |
| 图标 | Lucide React |
| 代理 | Cloudflare Workers |

## 快速开始

```bash
git clone https://github.com/lyon916/Arc.git
cd Arc

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

## 部署

Arc 输出纯静态文件 — 可部署到任何平台：

```bash
npm run build
# 将 dist/ 部署到 Vercel / Netlify / Cloudflare Pages / GitHub Pages
```

### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name=arcapi
```

### CORS 代理（推荐部署）

部署你自己的代理，让用户可信可控：

```bash
cd worker
npx wrangler deploy
```

然后在 Cloudflare DNS 中添加 CNAME `proxy.yourdomain.com → @`，并在 `src/utils/fetch.ts` 中更新 `PROXY_URL`。详见 [worker/README.md](worker/README.md)。

> 默认代理（`proxy.arcapi.xyz`）完全开源 — 无日志、无持久化。但自部署能给你和用户完全的控制权。

## 项目结构

```
Arc/
├── public/                # 静态资源（robots.txt、manifest.json、sitemap.xml）
├── src/
│   ├── components/
│   │   ├── common/        # 通用组件（Toast、Modal、SplitPane、CodeGen）
│   │   ├── env/           # 环境变量管理
│   │   ├── history/       # 请求历史
│   │   ├── layout/        # 布局（导航栏、侧边栏、移动端导航）
│   │   ├── request/       # 请求面板（URL、Headers、Body、Auth）
│   │   ├── response/      # 响应面板（格式化、原始、Headers）
│   │   └── workspace/     # 集合（已保存的请求和文件夹）
│   ├── db/                # IndexedDB（Dexie）
│   ├── hooks/             # 自定义 React Hooks
│   ├── store/             # Zustand 状态管理
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具（fetch、curl 解析、代码生成、环境变量）
│   ├── i18n.ts            # 中英文翻译
│   ├── App.tsx            # 根布局（桌面端 + 移动端响应式）
│   ├── main.tsx           # 入口文件
│   └── index.css          # 17 主题设计系统
├── worker/                # CORS 代理（Cloudflare Worker）
│   ├── src/
│   │   └── index.js       # 约 80 行 — 无状态、无日志
│   ├── wrangler.toml
│   └── README.md
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 数据隐私

- **所有用户数据**（历史、集合、环境变量）均存储在本地 IndexedDB 中。不会上传到任何服务器。
- **代理**不记录、不存储、不检测请求内容。纯 TCP 透传 — 可在 [worker/src/index.js](worker/src/index.js) 自行验证。

## 参与贡献

欢迎提交 Pull Request！重大改动请先开 Issue 讨论。

## 开源协议

[MIT](LICENSE) © 2026 Arc
