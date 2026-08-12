# Private App Update Pipeline (Desktop + Mobile)

Date: 2026-03-29

## Architecture Implemented

1. Desktop auto-update source:

- MinIO feed (Windows NSIS installer + `latest.yml`)
- Platform-specific authenticated app proxies for Windows and macOS
- Triggered by a push to the `desktop` branch

2. Mobile update source:

- OTA via EAS Update channel (`preview`) for PR builds
- APK build via EAS Build
- APK artifact uploaded to GitHub + optional MinIO mirror
- Triggered by PR to `mobile` branch

## Workflows

- `.github/workflows/desktop-release.yml`
  - Builds Windows desktop app
  - Publishes release files to MinIO:
    - `.../latest/`
    - `.../v<version>/`
- `.github/workflows/desktop-windows-test.yml`
  - Manually builds a Windows-only test installer
  - Bakes the selected test web URL and update feed URL into the packaged shell
  - Uploads the installer as a short-lived GitHub Actions artifact

- `.github/workflows/mobile-android-apk.yml`
  - Publishes OTA update to EAS channel `preview`
  - Builds Android APK
  - Uploads APK artifact
  - Optionally mirrors APK to MinIO

## Required GitHub Secrets

### Core (MinIO)

- `MINIO_ENDPOINT`
  - Example: `https://minio.vipexparcel.com`
- `MINIO_REGION`
  - Example: `us-east-1`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET`
  - Example: `vipex-uploads`

### Desktop publish path

- No extra secret required.
- Workflow default prefix: `desktop/windows`
- Internal object path produced:
  - `<MINIO_ENDPOINT>/<MINIO_BUCKET>/desktop/windows/latest/`
- Do not use the MinIO URL directly in the desktop app. Use the authenticated app proxy:
  - `<APP_BASE_URL>/v1/desktop-updates/windows/latest/`

### Mobile publish path (optional mirror)

- No extra secret required.
- Workflow default prefix: `mobile/android`

### Expo / EAS

- `EXPO_TOKEN`
  - Required for `eas update` and `eas build`

## Required App Configuration

### Desktop

The release workflow embeds these platform-specific feeds in the packaged apps:

- `DESKTOP_UPDATE_FEED_URL=<APP_BASE_URL>/v1/desktop-updates/windows/latest/`
- `DESKTOP_UPDATE_FEED_URL=<APP_BASE_URL>/v1/desktop-updates/macos/latest/`

Private desktop feeds are checked and downloaded from the in-app **App Updates** page with
the logged-in user's bearer token. The API validates that token, then streams the update
metadata and artifacts from private MinIO storage. Unauthenticated startup update checks
are disabled by default to avoid `401`/`403` responses from private feeds. Only set
`DESKTOP_ALLOW_UNAUTHENTICATED_UPDATE_CHECK=true` when the feed is intentionally public.

For pre-deploy Windows testing, run the manual **Desktop Windows Test Build** workflow or build locally on Windows:

- `bun run --cwd apps/desktop make:windows:test`

Optional build-time defaults:

- `DESKTOP_WEB_BASE_URL=https://testing.app.vipexparcel.com/`
- `DESKTOP_UPDATE_FEED_URL=https://testing.app.vipexparcel.com/v1/desktop-updates/windows/latest/`

### Mobile

In `apps/mobile/app.json`:

- `expo.extra.eas.projectId` must be real (not placeholder)
- `updates` enabled
- `runtimeVersion.policy` currently set to `appVersion`

In `apps/mobile/eas.json`:

- channels configured (`development`, `preview`, `production`)

## Update Detection Rules

### Desktop

- App compares its installed semantic version with `latest.yml` (Windows) or `latest-mac.yml` (macOS)
- If newer: available -> download -> install on restart
- Each `desktop` branch build receives a monotonically increasing `0.1.<run number>` version

### Mobile (OTA)

- App checks EAS channel on startup/foreground
- If update available and runtime-compatible:
  - prompt user
  - fetch + reload in app

## Notes

- This pipeline is private-distribution friendly (no App Store / Microsoft Store required).
- Windows auto-update uses NSIS because `electron-updater` does not support Squirrel.Windows.
- Test the first Squirrel-to-NSIS upgrade on an existing Windows installation before broad rollout.
- macOS auto-install requires an Apple-signed application; configure signing/notarization secrets before release.
- Desktop devices must reach the authenticated app endpoint; mobile devices must reach EAS.
- For iOS private distribution, add a separate workflow/profile when you are ready to ship IPA internally.
