# NEMSUEE Frontend

React + TypeScript + Vite client for the NEMSU E-Learning Environment.

## Overview

This frontend provides:

- Role-based user interface (`GUEST`, `STUDENT`, `INSTRUCTOR`, `ADMIN`, `REGISTRAR`, `DEAN`)
- Authentication and account activation flows
- Course catalog and course workspace
- Quizzes, tasks, score views, and grade computation views
- Admin panel and settings screens
- File storage UI (Google Drive integration via backend)

Tech stack:

- React 19
- TypeScript
- Vite 7
- React Router
- Tailwind CSS v4
- Vercel Analytics + Speed Insights

## Folder Structure

```text
frontend/
  src/
    App.tsx                 # Main app shell and view routing
    main.tsx                # React bootstrap
    features/               # Domain features (auth, courses, admin, etc.)
    app/layout/             # Shared layout components
    shared/                 # Shared hooks/types/constants/components
    lib/                    # API client helpers
  public/
  index.html
  vite.config.ts
  vercel.json
```

## Getting Started

### 1) Install dependencies

```bash
cd frontend
npm install
```

### 2) Configure environment

Create `.env` (or `.env.local`) with:

```env
VITE_API_URL=http://localhost:5000/api
```

Notes:

- `VITE_API_URL` can be absolute (`https://api.my-nemsu.site/api`) or relative (`/api`).
- In dev mode, if not provided, the app falls back to `http://localhost:5000/api`.

### 3) Run development server

```bash
npm run dev
```

### 4) Build for production

```bash
npm run build
```

### 5) Preview production build locally

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - run TypeScript build + Vite production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## API Integration

The app uses `useApi()` (`src/shared/hooks/useApi.ts`) to:

- prepend API base URL
- send cookies (`credentials: include`)
- normalize API error handling
- attach default JSON headers for authenticated app requests

Frontend expects backend endpoints under `/api/*`.

## Routing and UI Behavior

- Browser routing is handled with `BrowserRouter`.
- Vercel rewrite fallback routes all non-asset paths to `index.html`.
- Heavy views are lazy-loaded in `App.tsx` to reduce initial bundle size.

## Performance Notes

Current frontend optimizations include:

- Route/view code splitting with `React.lazy` + `Suspense`
- Vite manual chunking for router and analytics dependencies
- Optimized branding assets for lower transfer size
- Long-term immutable cache headers for `/assets/*` via `vercel.json`

## Deployment (Vercel)

`vercel.json` includes:

- immutable caching headers for static built assets
- SPA rewrite fallback for client-side routes

Recommended environment variable in Vercel:

- `VITE_API_URL=https://<your-api-domain>/api`

## Security and Secrets

- Never commit `.env.local` with tokens or secrets.
- Rotate exposed tokens immediately if leaked.
- Frontend should not embed private backend keys.

## Documentation Index

- [Architecture](./docs/ARCHITECTURE.md)
- [Configuration & Deployment](./docs/DEPLOYMENT.md)

