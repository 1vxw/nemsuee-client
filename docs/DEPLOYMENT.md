# Frontend Configuration and Deployment

## Environment Variables

### `VITE_API_URL`

API base URL used by `useApi()`.

Examples:

- Local backend:
  - `VITE_API_URL=http://localhost:5000/api`
- Production backend:
  - `VITE_API_URL=https://api.my-nemsu.site/api`
- Same-origin reverse proxy:
  - `VITE_API_URL=/api`

Notes:

- Do not include a trailing slash; the client normalizes it.
- In development, if not set, fallback is `http://localhost:5000/api`.

## Local Build and Validation

```bash
cd frontend
npm install
npm run build
npm run preview
```

## Vercel Deployment

### Build Command

```bash
npm run build
```

### Output Directory

```text
dist
```

### Required Vercel Environment Variables

- `VITE_API_URL` (set per environment: Preview/Production)

### Routing and Caching

`vercel.json` currently provides:

- SPA fallback rewrite to `index.html`
- immutable cache headers for `/assets/*`

## Common Production Issues

### 1) `Network/CORS error: cannot reach server`

Usually means one of:

- wrong `VITE_API_URL`
- backend is down
- backend CORS origin does not include frontend domain

Check:

- frontend domain in backend `ALLOWED_ORIGINS`/`FRONTEND_URL`
- backend health endpoint

### 2) `Cannot POST /api/...` from frontend

Likely backend deployment mismatch (older build or wrong service target).

Check:

- backend deployment version
- expected route exists on deployed backend
- proxy/domain points to correct service

### 3) Auth cookie not persisting

Check:

- HTTPS usage in production
- backend cookie flags and same-site policy
- browser third-party cookie policy if domains differ

## Release Checklist

- [ ] `npm run build` passes
- [ ] `VITE_API_URL` correct for target environment
- [ ] API routes reachable from deployed frontend
- [ ] login/logout flow verified
- [ ] critical user paths tested (auth, courses, scores, admin, storage)

