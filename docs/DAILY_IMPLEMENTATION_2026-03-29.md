# Daily Implementation - 2026-03-29

## Summary

Implemented production update foundations for both desktop and mobile so releases can be applied without uninstalling apps.

---

## 1) Electron Desktop In-App Updates

Updated:

- `apps/desktop/src/main.ts`
- `apps/desktop/src/preload.ts`
- `apps/web/src/vite-env.d.ts`

### What was added

- `electron-updater` runtime wiring in main process
- Update lifecycle tracking (`idle`, `checking`, `available`, `downloading`, `downloaded`, `not-available`, `error`)
- IPC handlers:
  - `updates:get-status`
  - `updates:check`
  - `updates:download`
  - `updates:install`
- Auto-check shortly after app launch in packaged builds
- Restart/install prompt after update download
- Renderer status push events via `updates:status`

### Preload bridge additions

- `window.api.updates.getStatus()`
- `window.api.updates.check()`
- `window.api.updates.download()`
- `window.api.updates.install()`
- `window.api.updates.onStatus(handler)`

### New desktop settings screen

- Route: `/settings/app-updates`
- Sidebar entry: `Setups -> Company Setup -> App Updates`
- Guarded by permission: `CanManageDesktopUpdates`
- Features:
  - live updater status
  - check for updates
  - download update
  - restart and install
  - desktop/web runtime awareness

### Header update badge

- Added header-level update indicator component:
  - `src/components/sidebar/update-indicator.tsx`
- Wired into:
  - `src/components/sidebar/header.tsx`

Behavior:

- Desktop only (`window.api.updates` required)
- Permission aware (`CanManageDesktopUpdates`)
- Shown only for actionable/non-idle states:
  - available
  - checking
  - downloading
  - downloaded
  - error
- Click opens `/settings/app-updates`

### Environment

- Optional `DESKTOP_UPDATE_FEED_URL` for generic feed-based update delivery.

---

## 2) Expo Mobile OTA Updates

Updated:

- `apps/mobile/app.json`
- `apps/mobile/eas.json`
- `apps/mobile/src/providers/app-update-provider.tsx`
- `apps/mobile/app/_layout.tsx`

### What was added

- `expo-updates` plugin/config
- Runtime update policy via `runtimeVersion.policy = appVersion`
- EAS channels in build profiles: `development`, `preview`, `production`
- Provider-based runtime checks on app start + foreground return
- User prompt to fetch and reload when update is available

---

## 3) Documentation Updates

Updated:

- `docs/ELECTRON_SHELL_IMPLEMENTATION.md`
- `docs/MOBILE_APP_IMPLEMENTATION.md`

Added:

- `docs/DAILY_IMPLEMENTATION_2026-03-29.md`

---

## 4) Validation

Checks completed:

- `bunx eslint apps/desktop/src/preload.ts apps/web/src/vite-env.d.ts --max-warnings=0`
- `bunx tsc -p tsconfig.json --noEmit`
