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
- `GET /sms-settings` (company provider and application SMS definitions)
- `PUT /sms-settings/default-provider`
- `PUT /sms-settings/events/:eventCode`

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

- Default provider is resolved by company and channel (`sms` or `email`).
- SMS providers are pluggable by `provider_key`.
- Built-in SMS keys:
  - `log_only`
  - `custom_webhook`
  - `mtn`
  - `mnotify`
- Email dispatch uses configured SMTP mailer pipeline.

The Platform Configuration → SMS Configuration page can select the company-wide default SMS
provider. Environment-backed providers such as `mnotify` are offered when their required server
variables are present; secrets are not returned to the client.

## Application SMS Definitions

Transactional SMS actions use a central event catalog and a company-specific template override:

- `pickup_queue_ticket`
- `receiver_pickup_otp`
- `parcel_status_call_pickup`
- `parcel_status_call_delivery`
- `parcel_status_call_follow_up`
- `parcel_status_call_contacted`

SMS Configuration displays the dispatch trigger, recipient, default/custom body, and supported
`{{variable}}` tokens for every event. Unknown variables are rejected when a definition is saved.
Every event dispatch creates a `notification_dispatches` record and resolves the authenticated
company's active default SMS provider. These transactional SMS settings remain available even when
the optional Notification Hub workspace module is disabled, because pickup and verification flows
can still dispatch operational messages. Every parcel event exposes `{{branch}}` and
`{{location}}`; these resolve to the parcel's destination branch and pickup or queue location, with
an empty location when the parcel has no assigned pickup location. Pickup queue tickets use the
branch name as the queue location when no more specific location exists.

Reusable templates and new bulk SMS messages support `{{senderName}}`, `{{senderPhone}}`,
`{{recipientName}}`, `{{recipientPhone}}`, `{{branch}}`, `{{location}}`, and `{{date}}`.
Sender, branch, and location values resolve from the user dispatching the campaign; recipient values
resolve from each audience record. A missing value resolves to an empty string. `{{companyId}}` is
not supported. Unknown variables are rejected when a template or campaign is saved, before any
messages are dispatched. This behavior is shared by the web template editor and bulk SMS composer.

QA scenarios:

1. Create a bulk SMS containing all seven supported variables; verify sender details and operational
   assignment come from the dispatching user and recipient details come from each audience record.
2. Send the same template as a user without a location; verify the message is dispatched with an
   empty location value.
3. Enter `{{companyId}}` or another unsupported token; verify the editor rejects the message.
4. Add `{{branch}}` and `{{location}}` to a transactional parcel definition; verify the dispatched
   message contains the parcel's destination branch and pickup or queue location.

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
