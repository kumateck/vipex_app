# Mobile Communication Refactor Notes

Date: 2026-04-11

## APK Build

- Status: Success
- APK: `/Users/gigisiri/Business/Employment/vipex/vipex_app/apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- Build command: `./gradlew assembleRelease` (from `apps/mobile/android`)
- Mobile API target: `https://testing.app.vipexparcel.com`

## Scope Completed

### 1) Chat Hub Architecture (modularized)

Implemented a feature-based mobile communication hub with top tabs:

- `Chats`
- `Channels`
- `Users`
- `Requests`

The bottom tab `Chat` now routes into this hub flow.

Key files:

- `apps/mobile/app/(app)/(tabs)/chat.tsx`
- `apps/mobile/app/(app)/(tabs)/communication.tsx`
- `apps/mobile/src/features/communication/components/hub/*`
- `apps/mobile/src/features/communication/hooks/use-communication-hub.ts`
- `apps/mobile/src/features/communication/hooks/use-communication-hub-actions.ts`

### 2) WhatsApp-style list behavior

Added/updated:

- Dense avatar/name/meta/preview row design
- Right-side time + unread pill
- Presence dot and typing-aware preview
- Filter chips in Chats pane: `All`, `Unread`, `Favourites`, `Groups`
- Archived awareness label in chats
- Long-press to toggle local favorite state

### 3) Thread screen redesign

Refactored thread page to thin wrapper + feature component + hook.

Added/updated:

- Timeline with day separators (`Today`, `Yesterday`, date)
- Incoming/outgoing bubble styling
- Composer row with plus, camera, send/mic behavior
- Mentions workflow preserved (`@everyone`, `@username`) and suggestions
- Quick action tray for media/contact/location actions

Key files:

- `apps/mobile/app/(app)/communication/thread/[threadId].tsx`
- `apps/mobile/src/features/communication/components/thread/communication-thread-screen.tsx`
- `apps/mobile/src/features/communication/hooks/use-communication-thread.ts`

### 4) Rich message content rendering

Added heuristic renderer for multiple message kinds:

- call-like
- voice/audio-like
- contact-like
- location-like
- link preview-like
- default text

Key file:

- `apps/mobile/src/features/communication/components/thread/thread-message-content.tsx`

### 5) Responsive calibration + theme support

Implemented width-based scaling utility and applied to hub/thread typography and control sizes.

Dark and light mode support is maintained for all new chat surfaces.

Key files:

- `apps/mobile/src/features/communication/utils/responsive-scale.ts`
- `apps/mobile/src/features/communication/components/hub/*`
- `apps/mobile/src/features/communication/components/thread/*`

### 6) Types extended for UI parity

Extended `CommunicationThread` with optional fields:

- `lastMessagePreview`
- `lastMessageType`
- `isArchived`
- `isPinned`
- `isFavourite`

Key file:

- `apps/mobile/src/types/communication.ts`

## Validation Completed

- Typecheck: passed (`tsc --noEmit`)
- File-size policy: passed (`MAX=300`)

## Current Known Gaps (next phase)

1. Favorites/archive should be persisted server-side (currently local UI behavior).
2. Message-type rendering should be backed by strict server payload contracts, not only heuristics.
3. True unread divider in thread timeline requires reliable per-message read marker.
4. Full online/last-seen presence model is not yet complete.
5. Final pixel QA on multiple physical device sizes is still needed.

## Suggested Next Tasks

1. Persist favorites/archive via API and hydrate in list queries.
2. Introduce explicit message content schema (`messageType`, `metadataJson`) for all rich card variants.
3. Add unread timeline divider using thread read state.
4. Add presence endpoint/socket model for online + last seen.
5. Run final visual QA on small and large Android devices and apply micro-adjustments.
