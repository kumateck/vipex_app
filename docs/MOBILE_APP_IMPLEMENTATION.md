# Mobile App Implementation

Last audited: 2026-08-27

## Runtime

The mobile workspace is `apps/mobile`. It is a bare React Native CLI application, not an Expo managed application.

Current foundation:

- React Native 0.83 and React 19.
- React Navigation for stacks, drawers, and tabs.
- Native Android and iOS projects checked into the repository.
- Native keychain storage for sensitive session material.
- Vision Camera for scanning workflows.
- LiveKit for voice communication.
- Reanimated, gesture handler, safe-area, and native screens for interaction and navigation.
- `react-native-config` for build-time environment values.

The application starts in `apps/mobile/index.js`, registers `src/app`, and uses the native project build systems.

## Current Feature Areas

### Authentication and Profile

- Login, forgot password, reset password, invitation password setup, and password change.
- Secure session persistence and refresh.
- Permission-, module-, company-, branch-, cashier-, and rider-aware navigation.

Current permission behavior and planned desktop-to-mobile capability work are maintained in [Mobile Permission Parity and Feature Roadmap](MOBILE_PERMISSION_PARITY_AND_ROADMAP.md).

### Dashboard and Cashier

- Standard, cashier, and rider dashboard states.
- Cashier active-session summary.
- Open and close cashier-session dialogs.
- Cashier sales and to-be-paid reporting.

### Parcels and Receiving

- Parcel creation and customer lookup.
- Sender-paid parcel plans.
- Queue management and ticket details.
- Parcel search and super search.
- Consignment list, scan-based receiving session, completeness checklist, and exception closeout.
- Receiver processing and OTP-enabled handover workflows.
- Self-service draft claim and pay-now completion.
- Call-center receiver follow-up and doorstep address/fee collection.
- Receiving discrepancy capture with linked camera photo evidence.
- Supervisor review of rider address and delivery-fee changes.
- Permission-controlled customer lookup and limited contact editing.

The implemented validation, failure behavior, and QA cases are documented in [Mobile Frontline Workflows](MOBILE_FRONTLINE_WORKFLOWS.md).

### Rider Operations

- Assigned and current deliveries.
- Delivery history.
- Customer collection fields and signature capture.
- Delivery change requests.
- Real-time assignment and delivery updates.

### Communication

- Chats, channels, groups, requests, threads, mentions, and presence.
- LiveKit voice-channel participation.
- Real-time synchronization with deduplication and reconnect behavior.

### Updates

- Private Android APK version check, download, progress, and install flow.
- Release endpoints are served through the application update API.
- Release builds reject local API endpoints.

## API and Domain Reuse

Mobile uses the same `/v1` server APIs as web and desktop. It must not reproduce pricing, authorization, OTP, payment, or parcel-transition authority locally.

Core groups include:

- `/auth`
- `/shipments`
- `/payments`
- `/cashiers` and `/shifts`
- `/pickup-queues`
- `/deliveries`
- `/communication`
- `/reports`
- `/mobile-updates`
- `/self-service`
- `/customers`
- `/uploads`

Every request derives company and user scope from the authenticated session. Client-provided filters can only narrow an already-authorized result.

Mobile navigation, destination screens, background loads, and mutations use the exact permission keys defined for the corresponding desktop capability. Screen access never implies action access. Company-module capabilities still require a client-bootstrap enhancement for complete proactive parity; the server module gates remain authoritative.

## Navigation and Architecture

New work follows the feature structure under `apps/mobile/src/features/<domain>/<feature>/`, separating components, dialogs, hooks, services, types, and utilities. Screen files are wrappers around feature components.

Older route-compatible files under `apps/mobile/app` may remain during migration, but the active native entry point is `src/app`; the presence of those files does not make this an Expo managed app.

## Build and Run

From the repository root:

- `bun run mobile:start`
- `bun run mobile:android`
- `bun run mobile:ios`

From `apps/mobile`:

- `bun run start`
- `bun run android`
- `bun run ios`
- `bun run typecheck`
- `bun run lint`

Android uses Gradle and iOS uses Xcode/CocoaPods. Release environment configuration is loaded through the native build configuration and `react-native-config`.

## Update Behavior

The current update mechanism is a private native APK pipeline, not Expo OTA Updates.

1. The app checks the mobile-update endpoint for a newer compatible Android release.
2. It shows release and version information.
3. The user downloads the APK with visible progress.
4. Native installation is requested after download and verification.
5. Failure leaves the installed version usable and offers retry.

iOS distribution uses the approved iOS release process; an Android APK update must not be presented on iOS.

## Security and Reliability

- Keep tokens in native keychain storage, not plain async storage or logs.
- Request camera, microphone, and install permissions only when required.
- Treat scan content and deep-link parameters as untrusted.
- Prevent duplicate mutations during reconnect or user retry.
- Revalidate permission and assignment changes after refresh or relogin.
- Do not bundle production secrets into the client.

## QA Baseline

- Authentication, refresh, logout, revoked session, and password changes.
- Permission and module combinations across standard, cashier, and rider accounts.
- Parcel create, sender payment, queue, receiving, OTP, and exception flows.
- Self-service completion, call-center follow-up, photo discrepancies, delivery-change review, and customer contact maintenance.
- Rider assignment, signature, collection, change request, and real-time reconnect.
- Communication messaging, mentions, calls, and reconnect.
- Android APK update available, current, failed download, cancelled install, and retry.
- Android and iOS native build and device smoke tests.

See [Mobile QA Smoke Checklist](MOBILE_QA_SMOKE_CHECKLIST.md) and [Client Applications](CLIENT_APPLICATIONS.md).
