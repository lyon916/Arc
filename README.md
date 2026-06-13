# Arc

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/lyon916/Arc/actions/workflows/ci.yml/badge.svg)](https://github.com/lyon916/Arc/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff)](https://vitejs.dev)

**Arc** = **A**PI **R**equest **C**onsole. A modern, lightweight API testing tool that runs entirely in your browser. No installation, no account, no server — just open and debug.

> **Live demo:** [www.arcapi.xyz](https://www.arcapi.xyz)

## Features

- **HTTP Request Builder** — GET / POST / PUT / DELETE / PATCH / HEAD / OPTIONS with Query Params, Headers, Body (JSON / FormData / Raw)
- **Authentication** — Bearer Token and Basic Auth
- **Environment Variables** — Create and manage multi-environment variables with `{{varname}}` syntax
- **Collections** — Save and organize requests with folder grouping
- **Request History** — Auto-saved history in local IndexedDB
- **cURL Import** — Paste cURL commands to instantly populate a request
- **Code Generation** — Export requests as JavaScript / TypeScript / cURL snippets
- **17 Themes** — Linear Dark, Dracula, Nord, Catppuccin, Solarized, GitHub Light, and more
- **Built-in CORS Proxy** — Toggle to route requests through the open-source [Cloudflare Worker proxy](./worker/) when blocked by CORS
- **i18n** — English and Chinese (auto-detects browser language)
- **Mobile Responsive** — Full-featured bottom-tab layout for mobile screens
- **Keyboard Shortcuts** — `Ctrl+Enter` send, `Ctrl+S` save, `Cmd+L` focus URL bar, `Esc` cancel

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
| Analytics | Google Analytics 4 |

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

Arc outputs static files — deploy to any static host:

```bash
npm run build
# Deploy dist/ to Vercel / Netlify / Cloudflare Pages / GitHub Pages
```

### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name=arcapi
```

### CORS Proxy (optional)

When making cross-origin requests from the browser, toggle the 🛡 shield icon to route through the proxy. Deploy your own:

```bash
cd worker
npx wrangler deploy
```

Add a CNAME record: `proxy.yourdomain.com` → `@`. Update `PROXY_URL` in `src/utils/fetch.ts` to match. See [worker/README.md](worker/README.md) for details.

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
│   │   └── index.js       # Worker code — stateless, no logging
│   ├── wrangler.toml
│   └── README.md
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Data Privacy

All data (request history, collections, environment variables) is stored **locally in your browser's IndexedDB**. Nothing is sent to any server. Clearing browser data will remove all stored requests.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE) © 2026 Arc
