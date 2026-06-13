# Arc

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/lyon916/Arc/actions/workflows/ci.yml/badge.svg)](https://github.com/lyon916/Arc/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff)](https://vitejs.dev)

**Arc** = **A**PI **R**equest **C**onsole. The browser-based API client that *actually works* — one-click CORS bypass, no install, no account, no server.

> **Live demo:** [www.arcapi.xyz](https://www.arcapi.xyz) — open and start debugging immediately.

[中文文档](./README_zh.md)

## Why Arc?

Browser-based API tools all share one fatal flaw: **CORS**. You paste a URL, hit send, and get `blocked by CORS policy`. In Arc, you click the 🛡 shield icon and that's it — every request now routes through the built-in proxy and just works.

| | Arc | Hoppscotch (browser) | Postman (web) |
|---|---|---|---|
| CORS bypass | ✅ One-click toggle | ❌ Needs browser extension | ❌ Desktop app only |
| Proxy open-source | ✅ [80 lines, no logging](./worker/) | — | — |
| Deploy your own proxy | ✅ Cloudflare Worker | — | — |
| No install | ✅ | ✅ | ❌ App required |
| Offline/local-first | ✅ IndexedDB | ✅ | ❌ Account required |

## Features

- **🛡 Built-in CORS Proxy** — One-click toggle. Requests route through an open-source [Cloudflare Worker](./worker/) — no logging, no storage, deploy your own in 30 seconds.
- **HTTP Request Builder** — GET / POST / PUT / DELETE / PATCH / HEAD / OPTIONS with Query Params, Headers, Body (JSON / FormData / Raw)
- **Authentication** — Bearer Token and Basic Auth
- **Environment Variables** — Multi-environment `{{varname}}` syntax with quick switching
- **Collections** — Save and organize requests with folder grouping
- **Request History** — Auto-saved to local IndexedDB, searchable and undo-able
- **cURL Import** — Paste cURL commands to instantly populate a request
- **Code Generation** — Export as JavaScript / TypeScript / cURL snippets
- **17 Themes** — Linear Dark, Dracula, Nord, Catppuccin, Solarized, GitHub Light, and more
- **i18n** — English / Chinese (auto-detects browser language)
- **Mobile Responsive** — Full-featured bottom-tab layout
- **Keyboard Shortcuts** — `Ctrl+Enter` send, `Ctrl+S` save, `Ctrl+L` focus URL, `Esc` cancel

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19 |
| Build | Vite 6 |
| Language | TypeScript |
| Styling | TailwindCSS 4 + DaisyUI 5 |
| State | Zustand 5 |
| Storage | Dexie 4 (IndexedDB) |
| Icons | Lucide React |
| Proxy | Cloudflare Workers |

## Quick Start

```bash
git clone https://github.com/lyon916/Arc.git
cd Arc

# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Deployment

Arc outputs static files — deploy anywhere:

```bash
npm run build
# Deploy dist/ to Vercel / Netlify / Cloudflare Pages / GitHub Pages
```

### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name=arcapi
```

### CORS Proxy (recommended)

Deploy your own proxy so users can trust it or customize it:

```bash
cd worker
npx wrangler deploy
```

Then add a CNAME `proxy.yourdomain.com → @` in Cloudflare DNS, and update `PROXY_URL` in `src/utils/fetch.ts`. See [worker/README.md](worker/README.md) for details.

> The default proxy (`proxy.arcapi.xyz`) is fully open-source — no logging, no persistence. But self-hosting gives you and your users full control.

## Project Structure

```
Arc/
├── public/                # Static assets (robots.txt, manifest.json, sitemap.xml)
├── src/
│   ├── components/
│   │   ├── common/        # Shared components (Toast, Modal, SplitPane, CodeGen)
│   │   ├── env/           # Environment variable management
│   │   ├── history/       # Request history
│   │   ├── layout/        # Layout (Navbar, Sidebar, MobileNav)
│   │   ├── request/       # Request panel (URL, Headers, Body, Auth)
│   │   ├── response/      # Response panel (pretty, raw, headers)
│   │   └── workspace/     # Collections (saved requests & folders)
│   ├── db/                # IndexedDB (Dexie)
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand state management
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utilities (fetch, curl parser, codegen, env vars)
│   ├── i18n.ts            # Chinese / English translations
│   ├── App.tsx            # Root layout (desktop + mobile responsive)
│   ├── main.tsx           # Entry point
│   └── index.css          # 17-theme design system
├── worker/                # CORS proxy (Cloudflare Worker)
│   ├── src/
│   │   └── index.js       # ~80 lines — stateless, no logging
│   ├── wrangler.toml
│   └── README.md
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Data Privacy

- **All user data** (history, collections, env vars) is stored locally in IndexedDB. Nothing leaves your browser.
- **The proxy** does not log, store, or inspect requests. It is a pure TCP passthrough — verify it yourself in [worker/src/index.js](worker/src/index.js).

## Contributing

Pull requests welcome! For major changes, please open an issue first.

## License

[MIT](LICENSE) © 2026 Arc
