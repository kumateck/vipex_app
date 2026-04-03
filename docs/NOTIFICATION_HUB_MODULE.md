# Notification Hub Module

Date: 2026-03-31
Module code: `notification_hub`
Status: Implemented (v1)

## Purpose

Standalone outbound messaging module for:

- Bulk SMS and email campaigns
- Event-based campaigns (holiday, celebration, birthday)
- Provider management with default provider per channel
- Approval-controlled campaign execution
- Delivery logs and retry handling
- Call-center parcel status notifications to receivers

## Company Module Gating

- Backend routes are gated with `requireModuleEnabled('notification_hub')`.
- UI routes are mapped to `notification_hub` in `src/shared/company-modules/route-modules.ts`.
- When disabled:
  - `/notification-hub/*` routes are hidden/blocked in the private app
  - `/v1/notification-hub/*` APIs are blocked

## Data Model

Schema file:

- [src/db/schemas/notification-hub.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/db/schemas/notification-hub.ts)

Tables:

1. `notification_providers`

- Channel: `sms` or `email`
- Provider key (extensible), name, config JSON
- `is_default` per channel
- Active flag

2. `notification_templates`

- Channel + template code
- Subject/body with variable placeholders
- Active flag

3. `notification_campaigns`

- Campaign metadata and channel
- Audience type
- Template reference + subject/body overrides
- Approval workflow state

4. `notification_dispatches`

- Per-recipient delivery row
- Provider used, attempts, status
- Error and provider message id
- Retry support

Migration:

- [drizzle/0003_notification_hub.sql](/Users/gigisiri/Business/Employment/vipex/vipex_app/drizzle/0003_notification_hub.sql)

## Backend API

Base path: `/v1/notification-hub`

Providers:

- `GET /providers`
- `POST /providers`
- `PATCH /providers/:id`
- `POST /providers/:id/default`

Templates:

- `GET /templates`
- `GET /templates/options`
- `POST /templates`
- `PATCH /templates/:id`

Campaigns:

- `GET /campaigns`
- `POST /campaigns`
- `POST /campaigns/:id/submit`
- `POST /campaigns/:id/approve`
- `POST /campaigns/:id/reject`
- `POST /campaigns/:id/send`
- `GET /campaigns/:id/dispatch-summary`

Dispatch logs:

- `GET /dispatches`
- `POST /dispatches/:id/retry`

Call-center event send:

- `POST /events/parcel-status-call`

## Frontend Routes (Separated List/Create/Approvals)

- `/notification-hub` (overview)
- `/notification-hub/providers` (list)
- `/notification-hub/providers/new` (create)
- `/notification-hub/templates` (list)
- `/notification-hub/templates/new` (create)
- `/notification-hub/campaigns` (list)
- `/notification-hub/campaigns/new` (create)
- `/notification-hub/campaigns/approvals` (approvals)
- `/notification-hub/dispatches` (delivery logs)

## Permissions

- `CanReadNotificationHub`
- `CanManageNotificationProviders`
- `CanManageNotificationTemplates`
- `CanCreateNotificationCampaigns`
- `CanApproveNotificationCampaigns`
- `CanSendNotificationCampaigns`
- `CanRetryNotificationMessages`
- `CanSendCallCenterNotifications`

Call-center event endpoint also allows existing call-center permission:

- `CanReadCallCenterParcelStatus`

## Provider Extensibility

Current behavior:

- Default provider is resolved by channel (`sms` or `email`).
- SMS providers are pluggable by `provider_key`.
- Built-in SMS keys:
  - `log_only`
  - `custom_webhook`
- Email dispatch uses configured SMTP mailer pipeline.

Adding providers:

1. Add provider row in `notification_providers`.
2. Mark one provider as default per channel.
3. For custom SMS integrations, add send logic in:
   - [src/server/features/notification-hub/service.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/notification-hub/service.ts)

## Call Center Integration

Parcel Status page now has SMS/email toggles in Call Outcome dialog.

Flow:

1. Agent saves call outcome.
2. Agent optionally sends SMS/email to receiver (and second receiver when enabled).
3. Dispatch records are created in `notification_dispatches`.
4. Failed sends can be retried in Notification Hub logs.
