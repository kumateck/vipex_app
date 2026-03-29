# Private App Update Pipeline (Desktop + Mobile)

Date: 2026-03-29

## Architecture Implemented

1. Desktop auto-update source:

- MinIO feed (Windows Squirrel artifacts + `RELEASES`)
- Triggered by PR to `desktop` branch

2. Mobile update source:

- OTA via EAS Update channel (`preview`) for PR builds
- APK build via EAS Build
- APK artifact uploaded to GitHub + optional MinIO mirror
- Triggered by PR to `mobile` branch

## Workflows

- `.github/workflows/desktop-windows-release.yml`
  - Builds Windows desktop app
  - Publishes release files to MinIO:
    - `.../latest/`
    - `.../v<version>/`

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
- Feed path produced:
  - `<MINIO_ENDPOINT>/<MINIO_BUCKET>/desktop/windows/latest/`
- Use this value for desktop app feed config (`DESKTOP_UPDATE_FEED_URL`).

### Mobile publish path (optional mirror)

- No extra secret required.
- Workflow default prefix: `mobile/android`

### Expo / EAS

- `EXPO_TOKEN`
  - Required for `eas update` and `eas build`

## Required App Configuration

### Desktop

Set runtime env for packaged desktop app:

- `DESKTOP_UPDATE_FEED_URL=<MINIO_ENDPOINT>/<MINIO_BUCKET>/<DESKTOP_MINIO_PREFIX>/latest/`

### Mobile

In `apps/mobile/app.json`:

- `expo.extra.eas.projectId` must be real (not placeholder)
- `updates` enabled
- `runtimeVersion.policy` currently set to `appVersion`

In `apps/mobile/eas.json`:

- channels configured (`development`, `preview`, `production`)

## Update Detection Rules

### Desktop

- App compares current version with MinIO feed metadata
- If newer: available -> download -> install on restart

### Mobile (OTA)

- App checks EAS channel on startup/foreground
- If update available and runtime-compatible:
  - prompt user
  - fetch + reload in app

## Notes

- This pipeline is private-distribution friendly (no App Store / Microsoft Store required).
- Devices must be able to reach MinIO/EAS endpoints.
- For iOS private distribution, add a separate workflow/profile when you are ready to ship IPA internally.
