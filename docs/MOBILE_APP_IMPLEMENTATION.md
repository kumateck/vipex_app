# Mobile App Implementation (Expo + React Native)

Date: 2026-03-27

## Overview

A new mobile workspace has been added at `apps/mobile` using the latest Expo SDK generated template baseline and upgraded to Expo Router architecture.

Primary capabilities implemented:

- Auth lifecycle:
  - Login
  - Forgot password
  - Reset password
  - Set password (invite token flow)
  - Change password
- Role/permission-driven module access:
  - Queue creation
  - Rider operations
  - In-transit scan-to-receive
- QR scanning for transit receipt confirmation:
  - Camera-based QR scan
  - Manual fallback search + confirm receive

## Folder

- `apps/mobile`
  - `app/(auth)` auth screens
  - `app/(app)` protected operations screens
  - `src/lib` API and auth/session utilities
  - `src/providers` auth provider
  - `src/types` mobile types

## API Reuse

Mobile uses existing backend APIs and current logic:

- `POST /v1/auth/login`
- `POST /v1/auth/forgot-password`
- `POST /v1/auth/reset-password`
- `POST /v1/auth/change-password`
- `POST /v1/auth/refresh`
- `GET /v1/shipments/parcels` (search/filter)
- `PATCH /v1/shipments/parcels/:id` (status updates)
- `POST /v1/pickup-queues`
- `GET /v1/deliveries/dd/rider/:riderUserId`
- `POST /v1/deliveries/dd/:parcelId/rider-given`
- `POST /v1/deliveries/dd/:parcelId/returned`

## Transit Scan-to-Receive Logic

Implemented in `apps/mobile/app/(app)/receive.tsx`.

Behavior mirrors current web flow:

1. Scan QR code from parcel sticker
2. Search parcel within:
   - `companyId = logged-in user company`
   - `destinationId = logged-in user branch`
   - `status = IN_TRANSIT (2)`
3. If found, mark status to `ARRIVED_AT_DESTINATION (3)`
4. Show success/failure feedback
5. Manual fallback: search by tracking/booking and confirm

## Queue Creation Logic

Implemented in `apps/mobile/app/(app)/queue.tsx`.

Flow:

1. Search parcels at destination branch with status `AWAITING_PICKUP (5)`
2. Create queue via `POST /pickup-queues`
3. Show generated queue code (if returned)

## Rider Logic

Implemented in `apps/mobile/app/(app)/rider.tsx`.

Flow:

- Load current/history assignments by rider user id (`session.user.sub`)
- Actions for current items:
  - mark given to customer
  - mark returned to office

## Permission-Based Module Access

Implemented in `apps/mobile/src/lib/permissions.ts`.

Home screen only exposes modules if permissions allow.

## Build and Run

From root (Bun):

- `bun run mobile:start`
- `bun run mobile:android`
- `bun run mobile:ios`

From mobile workspace:

- `bun run dev`
- `bun run start`

EAS profiles configured in `apps/mobile/eas.json`:

- development
- preview
- production

## Mobile Runtime Updates (OTA)

Implemented with Expo Updates so mobile users can receive new releases without reinstalling the app.

Files:

- `apps/mobile/app.json`
- `apps/mobile/eas.json`
- `apps/mobile/src/providers/app-update-provider.tsx`
- `apps/mobile/app/_layout.tsx`

Configuration:

- `runtimeVersion.policy = appVersion`
- `updates.enabled = true`
- `updates.checkAutomatically = ON_LOAD`
- EAS update channels:
  - `development`
  - `preview`
  - `production`

Runtime behavior:

- App checks for updates on launch and when app returns to foreground.
- Check frequency is throttled to avoid excessive calls.
- When an update is available, user is prompted to install now.
- Install flow uses:
  - `checkForUpdateAsync()`
  - `fetchUpdateAsync()`
  - `reloadAsync()`

## GitHub Android APK Build

Workflow added:

- `.github/workflows/mobile-android-apk.yml`

Trigger:

- Pull request to `mobile` branch
- Manual run (`workflow_dispatch`)

Output:

- Downloads APK from EAS and uploads to GitHub Artifacts
- Artifact name pattern: `vipex-mobile-android-apk-*`

Required GitHub secret:

- `EXPO_TOKEN` (Expo access token with build permissions)

Important:

- Ensure `apps/mobile/app.json` has a valid EAS project ID under `expo.extra.eas.projectId`
  before CI runs in non-interactive mode.

## Environment

Default API base in `apps/mobile/app.json` points to:

- `https://testing.app.vipexparcel.com`

Runtime uses `/v1` automatically in mobile API layer.

You can override with:

- `EXPO_PUBLIC_API_BASE_URL`

## Notes

- iOS build output is `.ipa` (not APK).
- Android internal install can use `.apk`; store upload uses `.aab`.
- Signature collection in rider flow currently uses placeholder text (`MOBILE_CONFIRMATION`) and can be upgraded to a real signature canvas capture next.
