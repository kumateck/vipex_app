# Private App Update Pipeline (Desktop + Mobile)

Date: 2026-03-29

## Architecture Implemented

1. Desktop auto-update source:

- MinIO feed (Windows NSIS installer + `latest.yml`)
- Platform-specific authenticated app proxies for Windows and macOS
- Triggered by a push to the `desktop` branch

2. Mobile update source:

- Native Android APK built by Gradle
- APK artifact uploaded to GitHub and published to private MinIO storage
- Authenticated app endpoint returns release metadata and a short-lived signed APK URL
- Triggered by a push to the `mobile` branch

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

- `.github/workflows/mobile-apk.yml`
  - Assigns a monotonically increasing `versionCode` and release version
  - Builds the Android APK
  - Uploads the APK and `latest.json` artifact
  - Publishes both `mobile/android/latest/` and `mobile/android/v<version>/` to MinIO

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

### Mobile publish path

- No extra secret required.
- Workflow default prefix: `mobile/android`
- A mobile release fails when the MinIO configuration is missing, preventing an APK from being
  advertised without a downloadable private artifact.

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

- Android releases use the same tracked signing key so installed private APKs can upgrade in place.
- The app checks `/v1/mobile-updates/android/latest` after authentication and when returning to the
  foreground.
- Android 8+ users must allow Vipex Mobile as an install source the first time they update.

## Update Detection Rules

### Desktop

- App compares its installed semantic version with `latest.yml` (Windows) or `latest-mac.yml` (macOS)
- If newer: available -> download -> install on restart
- Each `desktop` branch build receives a monotonically increasing `0.1.<run number>` version

### Mobile (Android APK)

- App compares its installed native `versionCode` with the private `latest.json` release metadata.
- If a newer build exists, it prompts once per app session.
- **Update now** downloads the signed MinIO APK through Android Download Manager and opens the
  package installer when ready.

## Notes

- This pipeline is private-distribution friendly (no App Store / Microsoft Store required).
- Windows auto-update uses NSIS because `electron-updater` does not support Squirrel.Windows.
- Test the first Squirrel-to-NSIS upgrade on an existing Windows installation before broad rollout.
- macOS auto-install requires an Apple-signed application; configure signing/notarization secrets before release.
- Desktop and mobile devices must reach the authenticated app endpoint and MinIO download host.
- For iOS private distribution, add a separate workflow/profile when you are ready to ship IPA internally.
