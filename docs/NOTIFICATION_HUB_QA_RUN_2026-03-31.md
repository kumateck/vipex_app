# Notification Hub QA Run 2026-03-31

## Scope

Executed checklist: `docs/NOTIFICATION_HUB_QA_CHECKLIST.md`

This run is a static/code QA execution plus compile checks in current environment.
Runtime DB/provider scenarios are marked as pending because no `DATABASE_URL` was available in-session.

## Static QA Result

Status: PASS (code-level and compile scope)

## Verified (Static)

1. Module gating and routing

- `notification_hub` route-module mapping exists in:
  - `src/shared/company-modules/route-modules.ts`
- Backend route mount exists in:
  - `src/server/app.ts` (`/v1/notification-hub`)
- All notification hub endpoints are module-gated by:
  - `requireModuleEnabled('notification_hub')`

2. Route separation (list/create/approvals)

- Verified route files exist:
  - `/notification-hub/providers`
  - `/notification-hub/providers/new`
  - `/notification-hub/templates`
  - `/notification-hub/templates/new`
  - `/notification-hub/campaigns`
  - `/notification-hub/campaigns/new`
  - `/notification-hub/campaigns/approvals`
  - `/notification-hub/dispatches`

3. Permission gates

- Added and referenced permission keys:
  - `CanReadNotificationHub`
  - `CanManageNotificationProviders`
  - `CanManageNotificationTemplates`
  - `CanCreateNotificationCampaigns`
  - `CanApproveNotificationCampaigns`
  - `CanSendNotificationCampaigns`
  - `CanRetryNotificationMessages`
  - `CanSendCallCenterNotifications`
- Backend route guards verified in `src/server/features/notification-hub/routes.ts`.
- Sidebar and route permission overrides verified in `src/components/sidebar/navigation.tsx` and `src/shared/permissions/constants.ts`.

4. Call-center integration

- Parcel Status page has send toggles (`sendSms`, `sendEmail`) and calls event endpoint.
- New mutation wired:
  - `sendParcelStatusCallNotification` -> `POST /notification-hub/events/parcel-status-call`
- Backend accepts and processes call-center event sends with dispatch logging.

5. Compile/regression checks

- `bun run routes:generate` passed.
- `bunx tsc --noEmit` passed.

## Runtime Validation Pending (Local environment)

The following checklist sections require running app + DB + provider config and remain pending in this session:

1. Module disable/enable behavior in live UI and API responses.
2. Provider CRUD with real default switching persistence.
3. Template create/deactivate visibility in options endpoint.
4. Full campaign lifecycle transitions with actual sends.
5. Audience resolution using live seeded data (`customers_all`, `users_all`, `employees_all`, `employees_birthday_today`).
6. Dispatch retry behavior using intentionally failed sends.
7. End-to-end call-center sends to receiver/second receiver and retry from logs.

## Local Run Commands (for completing runtime checklist)

1. `bun run migrate`
2. `bun run seed:permissions:system-admin`
3. enable `notification_hub` in company modules
4. run the scenarios in `docs/NOTIFICATION_HUB_QA_CHECKLIST.md`

## Notes

- Runtime execution was attempted in this session:
  - `bun run migrate` -> failed with `ECONNREFUSED ::1:5432` and `ECONNREFUSED 127.0.0.1:5432`
  - `bun run seed:permissions:system-admin` -> failed with the same DB connection error
- This confirms runtime checklist items are currently blocked by DB connectivity in this environment.
- Static scope for item 3 is complete and compile-safe.
