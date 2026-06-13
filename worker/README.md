# Arc CORS Proxy

A stateless Cloudflare Worker that forwards API requests to bypass browser CORS restrictions.

## How It Works

```
Browser (www.arcapi.xyz)  →  proxy.arcapi.xyz/?url=TARGET  →  Target API
                                  ↑
                         Cloudflare Worker (this repo)
                         strips origin, adds CORS headers
```

- No logging, no storage — the worker does not persist any request data
- Strips origin/referer/cookie headers before forwarding
- Strips Set-Cookie/CSP from upstream responses
- All code is in a single file: `src/index.js`

## Deploy

```bash
# Install wrangler
npm install -g wrangler

# Set your Cloudflare account ID (from dash.cloudflare.com URL)
export CLOUDFLARE_ACCOUNT_ID="your_account_id"

# Or uncomment account_id in wrangler.toml

# Deploy
npx wrangler deploy
```

## DNS

Add a CNAME record in Cloudflare DNS:
```
proxy.arcapi.xyz  →  CNAME  →  @
```

## Test

```bash
# Health check
curl https://proxy.arcapi.xyz/health

# Forward a request
curl 'https://proxy.arcapi.xyz/?url=https%3A%2F%2Fhttpbin.org%2Fget'
```

## Privacy

This worker does NOT:
- Log requests
- Store request/response bodies
- Track users
- Use any external database or analytics

It is a pure passthrough. Deploy your own instance for full control.
