# Frontend Architecture

## High-Level Design

The app is a role-aware SPA built around:

- a single top-level shell (`App.tsx`)
- feature modules under `src/features`
- shared utilities/hooks/types under `src/shared`

Core pattern:

- `App.tsx` orchestrates authenticated state and active view
- feature components receive `api`, `headers`, and `setMessage` props
- each feature handles its own local UI state and calls backend APIs

## Main Layers

### 1) App Shell

- `src/main.tsx` bootstraps `BrowserRouter`
- `src/App.tsx` manages:
  - session bootstrap (`/auth/me`)
  - role-based navigation
  - lazy loading of heavy feature views
  - global message and refresh coordination

### 2) Feature Modules

Examples:

- `features/auth` - login/register/reset/activation flows
- `features/courses` - catalog, course panel, content
- `features/quizzes` / `features/assignments` / `features/scores`
- `features/admin` - admin panel/settings/management sections
- `features/storage` - Drive file management UI

### 3) Shared Layer

- `shared/hooks` - reusable hooks (API, notifications, pagination, etc.)
- `shared/types` - shared domain types
- `shared/components` - reusable UI controls
- `shared/utils` - helper functions

## Data Flow

1. User action triggers feature handler.
2. Handler uses `api(path, options)` from `useApi`.
3. Backend returns JSON.
4. Feature state updates and app-level message/refresh updates as needed.

Error handling is normalized in `useApi`:

- HTTP errors include `status` + `path`
- network/CORS failures are surfaced with a clear message

## State Strategy

- App-level state in `App.tsx`:
  - authenticated user
  - selected view
  - global collections used across views (courses, attempts, notifications)
- Feature-level state in each module:
  - form state
  - modal visibility
  - local query/filter/sort values

Persistence:

- `localStorage` stores user and preference-related UI state

## Performance Strategy

- Feature-level code splitting via `React.lazy`
- Manual chunking in `vite.config.ts`
- Static asset cache headers via `vercel.json`
- Optimized image assets in `src/assets`

## Styling

- Tailwind CSS v4 with project design tokens/classes from app styles
- Feature components use utility-first class composition

## Suggested Conventions for New Features

- Keep business logic in feature-specific services/hooks where possible
- Keep API route strings centralized per feature service
- Prefer typed payload/response interfaces in `shared/types` or feature `types`
- Keep `App.tsx` focused on orchestration, not feature internals

