# Mobile QA Smoke Checklist

Last updated: 2026-08-27

## Scope

- `apps/mobile` UX and permission guard behavior.
- Theme behavior (light/dark/system).
- Queue, Rider, Receive, Incoming Process, and frontline operations workflows.

## Pre-check

1. Login with a user that has all mobile-related permissions.
2. Login with a restricted user for each role path:
   - Queue-only user
   - Rider-only user
   - Receive-only user
   - Self-service read-only and completing users
   - Call-center call-only and address-collection users
   - Customer read-only and update users
3. Confirm API base is set to `https://testing.app.vipexparcel.com`.

## Appearance checks

1. Toggle appearance mode on home: `system`, `light`, `dark`.
2. Force OS dark mode and verify `system` tracks OS.
3. Confirm text contrast in:
   - Login password field
   - KPI cards
   - Empty state messages
   - Buttons and chip labels

## Permission checks

1. Queue screen:
   - No queue permission -> no-access page.
   - View-only queue permission -> can view boards/search but cannot issue ticket.
2. Rider screen:
   - No rider permission -> no-access page.
   - View rider + no complete delivery permission -> can view parcel details but action buttons disabled.
3. Receive screen:
   - No receive permission -> no-access page.
   - View-only receive + no update permission -> can scan/view but cannot mark arrival.
4. Receive process screen:
   - No receive permission -> no-access page.
   - No update permission -> edit and confirm-arrived disabled.
5. Frontline workflows:
   - Tap each of the five Operations cards and confirm its titled screen opens instead of Dashboard.
   - Self-service read permission does not enable claim or completion.
   - Call-status permission does not enable address collection.
   - Address-collection permission does not record a call through the call-status endpoint.
   - Customer read permission does not enable contact editing.
   - Delivery review requires `CanMarkDoorstepCalled` and branch scope.
6. Dashboard identity:
   - IT Officer with rider read permissions remains on the standard Dashboard.
   - Only `userType = RIDER` receives Rider Dashboard and Rider tab presentation.
   - Missing or invalid `userType` falls back to the standard Dashboard.

## Interaction checks

1. Pull-to-refresh works on:
   - Queue
   - Rider
   - Receive
2. Per-action loading labels show correctly:
   - Queue ticket issue
   - Rider given/returned
   - Receive scan process
   - Receive process save/confirm
3. Haptics:
   - Success for successful actions
   - Warning for blocked/validation cases
   - Error for failures

## Status and skeleton checks

1. Status chips render and match status context:
   - In-transit/awaiting states as warning style
   - Arrived/delivered/paid as success style
2. Skeleton cards appear while loading lists on:
   - Queue boards and search results
   - Rider lists
   - Receive incoming list

## Functional smoke checks

1. Queue:
   - Search parcel
   - Open details
   - Issue ticket
   - Copy and share ticket
2. Rider:
   - Search parcel
   - Open details
   - Mark given
   - Mark returned
3. Receive:
   - Open the screen and confirm the incoming count loads automatically and matches the server total for the user's branch.
   - Confirm the camera shows a clearly visible moving scan band with a solid center line and "Scanner active" status before detection.
   - After detection, confirm haptic feedback occurs and the camera is covered by the large **QR detected — Finding incoming parcel…** progress overlay until lookup completes.
   - Scan a current tracking-URL QR and a legacy production `QR-<tracking-code>` sticker.
   - Repeat scan → parcel review → **Back To Incoming List** at least three times; every return must show a live camera preview without refresh, a dark preview, or `session/invalid-output-configuration`.
   - Force or simulate a camera-session error and confirm the in-screen **Restart Camera** recovery appears instead of a console error or unexplained dark preview.
   - Confirm an unreadable, wrong-branch, or non-in-transit QR does not open an unrelated parcel.
   - Search incoming
   - Open receive-process screen
4. Receive process:
   - Edit fields
   - Save edits
   - Confirm arrived
   - Tap **Back To Incoming List** after opening a parcel from scanning, manual search, and a direct route; each case must open the native parcel scanner screen, never the desktop incoming page.
5. Self-service:
   - List, inspect, claim, and complete sender/receiver/split pay-now drafts.
   - Confirm concurrent claim and expired draft errors do not create bookings.
6. Call center:
   - Open telephone app, record permitted call, validate address and fee, save collection.
7. Receiving discrepancies:
   - Select expected parcel or enter unmatched identifiers.
   - Require notes and photo; test denied camera and failed photo upload after successful create.
8. Delivery-change review:
   - Approve, reject, handle already-reviewed conflict, and reject another branch.
9. Customers:
   - Search, inspect read-only, update limited contact fields, and handle duplicate-phone conflict.

## Regression checks

1. `bun run --cwd apps/mobile typecheck` passes.
2. Rebuild and install the Android app after native scanner configuration changes; confirm the release APK detects QR codes without a prior model download.
3. Login, forgot, reset, and set password screens still render correctly.
4. Home quick-access links only show modules user has permission for.
