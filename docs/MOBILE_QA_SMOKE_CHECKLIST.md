# Mobile QA Smoke Checklist

Date: 2026-03-30

## Scope

- `apps/mobile` UX and permission guard behavior.
- Theme behavior (light/dark/system).
- Queue, Rider, Receive, and Incoming Process workflows.

## Pre-check

1. Login with a user that has all mobile-related permissions.
2. Login with a restricted user for each role path:
   - Queue-only user
   - Rider-only user
   - Receive-only user
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
   - Scan QR
   - Search incoming
   - Open receive-process screen
4. Receive process:
   - Edit fields
   - Save edits
   - Confirm arrived
   - Return to incoming list

## Regression checks

1. `bun run --cwd apps/mobile typecheck` passes.
2. Login, forgot, reset, and set password screens still render correctly.
3. Home quick-access links only show modules user has permission for.
