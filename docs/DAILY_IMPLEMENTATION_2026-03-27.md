# Daily Implementation Log - 2026-03-27

## 1) Electron + Monorepo Shell Architecture

- Enforced single-renderer architecture: Electron acts as shell only and loads the existing web app.
- Fixed Electron Forge/Vite startup issues (`config.renderer` shape, ESM/CommonJS mismatch, startup wiring).
- Kept backend independent (Electron + browser both consume backend over HTTP/WebSocket).
- Added/maintained preload bridge (`window.api`) for safe desktop capabilities.

Key files:

- `/Users/gigisiri/Business/Employment/vipex/vipex_app/apps/desktop/src/main.ts`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/apps/desktop/src/preload.ts`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/apps/desktop/forge.config.js`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/apps/web/vite.config.ts`

## 2) Web/Electron Runtime Fixes

- Resolved CSS loading/path issues for web and Electron contexts.
- Fixed API base/proxy behavior so frontend doesn’t incorrectly hit Vite dev server for backend routes in production-like paths.
- Addressed production build/runtime issues around `import.meta.env.DEV` and config loading behavior.
- Removed desktop-shell environment banner from app UI.

## 3) Desktop Packaging + Branding

- Prepared icon/branding support for browser + desktop (favicon/app icons/report identity assets).
- Wired desktop build expectations for mac/windows packaging workflows.
- Incorporated signing/notarization env usage expectations (Apple variables and cert handling context).

## 4) Printing Platform Foundation (Web + Electron)

- Implemented native desktop print path via Electron IPC.
- Added print routing preferences by document type (sticker vs invoice) in company settings.
- Implemented sender-payment parallel print dispatch (sticker + invoice to mapped printers at same time).
- Kept web path using browser print/react-to-print patterns.

Key files:

- `/Users/gigisiri/Business/Employment/vipex/vipex_app/apps/desktop/src/main.ts`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/apps/desktop/src/preload.ts`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/printing/services/desktop-print.ts`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/printing/services/printer-preferences.ts`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/company-modules/pages/company-settings-page.tsx`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/operations/parcel/components/parcel-receipt-actions.tsx`

## 5) Receipt/Sticker Layout Work

- Built and iterated thermal sticker and A5 invoice templates to match provided reference layouts.
- Adjusted typography, borders, sectioning, spacing, tax box layout, branch/contact header placement, and terms positioning.
- Added/reworked sender-paid and to-be-paid variants and related label semantics.

## 6) Deeplink + Smart Link Flow

- Added desktop protocol handling (single-instance, route mapping for reset/invite paths).
- Implemented smart intermediary web pages that attempt app-open and fall back to web.
- Updated reset/invite link generation to use smart open pages.

Key files:

- `/Users/gigisiri/Business/Employment/vipex/vipex_app/apps/desktop/src/main.ts`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/apps/web/public/open-reset-password.html`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/apps/web/public/open-invite.html`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/auth/service.ts`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/auth/service.invite.ts`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/auth/service.invite-resend.ts`
- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/users/service.invite.ts`

## 7) Backend Debugging + Error Visibility

- Added/improved local-dev 500 logging behavior for faster diagnosis.
- Investigated and surfaced concrete causes for runtime 500s (query alias collisions, invalid insert targets, etc.).
- Reduced silent failure patterns by making development diagnostics explicit.

## 8) UI/UX Structural Improvements

- Migrated long pages to `ScrollableWrapper` pattern where required.
- Improved non-scrolling page header/content behavior per requested pattern.
- Added/updated error boundary page structure.
- Changed some long views to tabbed arrangements with scroll handling within tab content.
- Updated parcel detail views to show location alongside destination and use names (not IDs).

## 9) Customer/Booking Flow Enhancements

- Implemented 10-digit telephone debounce search behavior (~1s) for customer lookup.
- Added support for secondary telephone in customer-related create flows.
- Updated sender/recipient selection UX logic (dropdown vs text input depending on existing customer state).
- Cleaned naming language (e.g., fullname usage direction).

## 10) Tax Engine Refactor (Major)

Completed shift away from hardcoded tax math toward DB-configured tax profiles/components.

### New tax utilities

- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/utils/tax/profile-engine.ts`
  - profile-component based computation
  - inclusive/exclusive component support
  - deterministic rounding and component summation helpers

### Accounting repository support

- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/accounting/repository.ts`
  - resolver for active tax profile + active effective components by date

### Payment write path migrated

- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/payments/service.ts`
  - principal payment tax now calculated from active DB profile/components
  - key mapping for VAT/GETFUND/NHIL/COVID aliases
  - no-profile fallback to zero-tax behavior

### Payment calculation/preview path migrated

- `/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/payments/calculation.service.ts`
  - removed hardcoded Ghana formula function
  - now computes taxes via active tax profile/components
  - cache hash includes tax-profile signature to avoid stale cached results after profile change
  - response now includes:
    - `appliedTaxProfileName`
    - `appliedTaxProfileId`

## 11) Validation and Quality Checks

- Repeated TypeScript validations after major patches.
- Latest validation status: `bunx tsc --noEmit` passes.

## Current Status

- Tax computation is profile-driven in both write and calculate/preview paths.
- Calculation responses expose applied tax profile metadata (`name` and `id`) for frontend display/audit.
- Printing, desktop bridging, and deeplink foundations are integrated with the single-app architecture.
