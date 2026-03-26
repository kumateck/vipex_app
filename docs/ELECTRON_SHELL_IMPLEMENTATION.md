# Electron Shell Implementation (Single React App)

## Scope

This document records the desktop integration implemented on **March 26, 2026**.

Goal:

- Keep **one React app only** (web app)
- Use Electron as a **thin native shell**
- Avoid any duplicated renderer/UI inside Electron

## Architecture Rules Enforced

- React UI source of truth: `apps/web`
- Electron renderer app: **not used**
- Electron responsibilities only:
  - native window lifecycle
  - preload bridge (`window.api`)
  - desktop runtime shell behavior
- Backend remains independent over HTTP/WebSocket

## Implemented Folder Structure

```text
root/
  apps/
    web/
    desktop/
  packages/
    ui/
    lib/
  backend/
  src/                    # existing app code still referenced by apps/web and backend wrapper
```

Notes:

- `apps/web` currently bootstraps the existing React app by importing from root `src`.
- `backend` currently wraps existing server modules from root `src/server`.
- This is a safe transition state; full physical relocation can happen in a later pass.

## Workspace + Scripts

Root workspace and scripts are defined in:

- `package.json`

### Workspaces

```json
"workspaces": ["apps/*", "packages/*"]
```

### Root scripts added/updated

- `dev:web`: run Vite web app (`apps/web`)
- `dev:desktop`: run Electron Forge (`apps/desktop`)
- `dev:backend`: run Bun API (`backend`)
- `dev:fullstack`: run web + backend
- `dev`: run web + desktop
- `build:web`: build Vite web app
- `dev:legacy`: preserves old integrated Bun startup

## Web App (`apps/web`)

Files:

- `apps/web/package.json`
- `apps/web/index.html`
- `apps/web/vite.config.ts`
- `apps/web/tsconfig.json`
- `apps/web/src/main.tsx`
- `apps/web/src/vite-env.d.ts`

### Critical Vite setting

In `apps/web/vite.config.ts`:

```ts
base: './';
```

This is required for Electron production loading from local files.

### Router compatibility

Routing was changed to hash-based behavior by updating:

- `src/pages/index.tsx`

Change made:

- `createBrowserRouter` -> `createHashRouter`

This avoids `file://` route resolution issues in Electron production.

## Electron App (`apps/desktop`)

Files:

- `apps/desktop/package.json`
- `apps/desktop/forge.config.js`
- `apps/desktop/tsconfig.json`
- `apps/desktop/vite.main.config.ts`
- `apps/desktop/vite.preload.config.ts`
- `apps/desktop/src/main.ts`
- `apps/desktop/src/preload.ts`

### No renderer UI

`apps/desktop` has no React renderer implementation.
Only `main` and `preload` processes are built.

### Window loading behavior (required pattern)

In `apps/desktop/src/main.ts`:

- Development:

```ts
mainWindow.loadURL('http://localhost:5173');
```

- Production:

```ts
mainWindow.loadFile(path.resolve(process.cwd(), '../web/dist/index.html'));
```

## Preload Bridge

File:

- `apps/desktop/src/preload.ts`

Exposed API:

- `window.api.platform()`
- `window.api.ping()`

Typing added in:

- `apps/web/src/vite-env.d.ts`

## Shared Packages

Created:

- `packages/ui`
- `packages/lib`

Files:

- `packages/ui/src/DesktopShellBadge.tsx`
- `packages/lib/src/runtime.ts`

Example usage is in:

- `apps/web/src/main.tsx`

This proves shared package imports are wired and usable by the single web UI.

## Backend Separation

Created backend workspace wrapper:

- `backend/package.json`
- `backend/tsconfig.json`
- `backend/src/index.ts`

Current wrapper imports existing server modules from root `src/server`.
Backend remains a separate process and is not embedded into Electron.

## TypeScript Pathing

Updated root `tsconfig.json` with:

- `@ui/*` -> `./packages/ui/src/*`
- `@lib/*` -> `./packages/lib/src/*`
- Added `DOM.Iterable` to `lib`

## Validation Performed

Executed successfully:

- `bun install`
- `bun run --cwd apps/web build`
- `bunx tsc -p apps/web/tsconfig.json --noEmit`
- `bunx tsc -p apps/desktop/tsconfig.json --noEmit`

## Dev and Production Workflow

### Development (desktop + web)

1. Terminal A:
   - `bun run dev:web`
2. Terminal B:
   - `bun run dev:desktop`

Or together:

- `bun run dev`

### Development (web + backend)

- `bun run dev:fullstack`

### Production build flow

1. Build web assets:
   - `bun run build:web`
2. Package desktop app:
   - `bun run --cwd apps/desktop make`

## Known Transitional State

The repo now has the required monorepo topology and shell-only Electron integration, but existing code still lives in root `src` and is referenced by both:

- `apps/web` (React entry import)
- `backend` (server import)

This was intentional to keep migration low-risk and non-breaking.
A later phase can physically move frontend/server code into `apps/web/src` and `backend/src` respectively.

## Guardrails (Do Not Violate)

- Do not add a second React renderer under `apps/desktop`
- Do not switch back to `BrowserRouter` for desktop-targeted builds
- Do not remove `base: './'` from `apps/web/vite.config.ts`
- Do not couple backend process lifecycle to Electron
