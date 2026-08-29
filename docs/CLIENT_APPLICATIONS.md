# Client Applications

## Runtime Clients

Vipex has three user-facing clients sharing the same server domain rules.

| Client  | Technology                                | Primary use                                                                      |
| ------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| Web     | React web application                     | Full operational, administrative, financial, and reporting workspace.            |
| Desktop | Electron shell around the web application | Windows operations with native printing and managed updates.                     |
| Mobile  | Bare React Native CLI application         | Cashier, receiver, rider, parcel creation, reports, scanning, and communication. |

The API is mounted under `/v1`. The server, not a client, is the authority for permissions, tenant scope, validation, pricing, payments, and status transitions.

## Web Application

The web client contains the complete sidebar workspace and feature modules. It uses shared authentication, module and permission gates, responsive layouts, browser printing, and the in-app help system.

Pages are thin route wrappers. Feature UI, hooks, services, types, and dialogs live in their domain feature folders according to `AGENTS.md`.

Production HTML and SPA fallback responses use `no-store/no-cache`; content-hashed files under
`/assets/` use a one-year immutable cache. If navigation hits the short deployment interval and a
lazy import reports **Failed to fetch dynamically imported module**, both the global handler and the
React Router error boundary show an **Updating application** recovery view and schedule a
cache-busted reload after 1.5 seconds. Recovery is limited to three automatic attempts per browser
session. After that limit, automatic refreshing stops and the recovery view keeps a manual Reload
action available; stale assets never appear as a generic 500 page.

A missing `/assets/` file returns a non-cacheable 404 instead of the SPA HTML fallback. This keeps
module failures explicit and prevents an HTML response from masquerading as JavaScript.

For production diagnosis, capture the exact asset URL from **Technical details** or browser DevTools
Network, check its status and content type, compare the current `x-app-build` meta value in
`index.html`, and review the web-server access log for that path and timestamp. This browser-side
chunk error will not necessarily produce an API exception or database log.

## Desktop Application

The Electron shell adds capabilities unavailable or inconsistent in a browser:

- Native printer discovery and printer routing.
- Separate sticker and A5/report print jobs.
- Copy-count options for native sticker jobs.
- Windows packaging and auto-update support.
- An application-server update stream backed by private release storage.

Desktop-specific failures must be surfaced to the web UI through the preload bridge. The renderer must not receive unrestricted Node or filesystem access.

Printer routing selects the device for a document class. Sticker copy quantity is user-selected and has no application-defined maximum; see [Parcel Printing](PARCEL_PRINTING.md).

## Mobile Application

The mobile client is a bare React Native 0.83 application with React Navigation, native keychain storage, camera/scanning support, real-time communication, and native Android/iOS projects.

Current feature areas include:

- Authentication and dashboard.
- Parcel creation, including sender-paid flows.
- Parcel receiving and receiver-cashier workflows.
- Mobile reporting.
- Rider assignment, current deliveries, history, change requests, and real-time updates.
- Communication and calls.
- Super search.
- Self-service draft completion.
- Call-center follow-up and doorstep address collection.
- Receiving discrepancies with camera photo evidence.
- Supervisor delivery-change review.
- Customer lookup and limited contact editing.
- Private in-app APK updates on Android.

Mobile feature availability remains permission-, module-, assignment-, company-, and branch-scoped.

See [Mobile Permission Parity and Feature Roadmap](MOBILE_PERMISSION_PARITY_AND_ROADMAP.md) for the current guard matrix and the prioritized desktop capabilities suitable for mobile.
See [Mobile Frontline Workflows](MOBILE_FRONTLINE_WORKFLOWS.md) for the implemented workflows, validation, failure recovery, and QA scenarios.

## Shared Behavior

All clients must align on:

- Authentication and session revocation.
- Permission and module-denial behavior.
- Company and branch isolation.
- Parcel, payment, OTP, and reconciliation validation.
- Idempotency and duplicate-submit protection.
- Date, currency, booking-code, tracking-code, and status presentation.
- Error messages that preserve completed work and describe recovery.

Client-specific layout or native integration may differ, but business outcomes must not.

## Application Updates

Desktop and mobile use private update pipelines managed by the application. Release clients must reject local API hosts and consume only approved update feeds. Update metadata, binaries, version checks, download progress, verification, and installation failures should be observable without exposing storage credentials.

Desktop update feeds are public to installed clients but reveal only the release artifacts required for updating. Administrative release operations remain protected.

## Offline and Network Failure

- Do not claim success until the server confirms a domain mutation.
- Preserve safe form state when a request fails.
- Retrying must not duplicate parcel creation, payment, completion, or transfer acknowledgement.
- Real-time disconnection must fall back to an explicit refresh or polling path where required.
- Update download failure must not prevent use of the currently installed compatible version unless the release is explicitly mandatory.

## Release Verification

- Web typecheck, tests, production build, responsive smoke test, and browser print test.
- During a web deployment, keep an old tab open and navigate to an unloaded route. Confirm a failed
  lazy chunk shows **Updating application** and performs a cache-busted reload into the current build
  instead of showing a 500 page. Simulate repeated failures and confirm automatic reloads stop after
  the third attempt.
- Confirm HTML is served with `no-store/no-cache` and hashed `/assets/` files with
  `max-age=31536000, immutable`.
- Desktop packaging, preload isolation, native printer routing, parallel print, copy count, and update test.
- Mobile typecheck, Android and iOS native builds, camera permissions, keychain, deep links, updates, and core workflow smoke tests.
- Cross-client authorization and domain-result parity.

Detailed client documents:

- [Mobile implementation](MOBILE_APP_IMPLEMENTATION.md)
- [Mobile QA smoke checklist](MOBILE_QA_SMOKE_CHECKLIST.md)
- [Electron shell implementation](ELECTRON_SHELL_IMPLEMENTATION.md)
- [Private app update pipeline](PRIVATE_APP_UPDATE_PIPELINE.md)
