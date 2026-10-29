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

- Default provider is resolved by company and channel (`sms`, `email`, or `whatsapp`).
- `whatsapp` uses provider key `meta_cloud` and only sends Meta-approved templates. It is managed from WhatsApp Settings (module `whatsapp_messaging`), not from this page. WhatsApp secrets are masked (`••••••••`) in provider list/detail responses. Delivery status (`delivered`, `read`, `failed`) is updated by the public WhatsApp webhook. See [WhatsApp messaging](WHATSAPP_MESSAGING.md).
- Digital receipt emails are sent through SMTP and logged here with `channel = 'email'`, `provider_key = 'smtp'`.
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

Digital receipt events (`digital_receipt_booking`, `digital_receipt_payment`, `digital_receipt_home_delivery`) appear in the definitions list and can be edited like other events. Their variables are `customerName`, `bookingCode`, `amountPaid`, `balance`, `destination`, `receiptUrl`, `branch` (destination branch), and `location` (pickup location, or drop-off address for home delivery). They also support `locationName` and `locationPhone` for the assigned pickup location contact. They are only dispatched when the `digital_receipts` module is enabled. See [Digital receipts](DIGITAL_RECEIPTS.md).

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
Call-outcome SMS templates also expose `{{branchPhone}}`, the destination branch's telephone.
The token renders as an empty string when that branch has no telephone. Existing call-outcome
templates show the token in the edit form's Variables JSON and save it with the other supported
variables; their message body changes only when an editor adds `{{branchPhone}}`. QA: edit a
previously saved pickup template, add the token to the body, send for a branch with a telephone,
and verify its number appears; repeat with a branch without one and verify no unresolved token.

OTP SMS events are explicitly classified at the event-definition level. The
`receiver_pickup_otp` event sends `sms_type: "otp"` in the mNotify provider payload (and the same
field to custom webhook providers). Ordinary queue, parcel-status, template, and bulk messages do
not include `sms_type`. Account setup and password-reset OTP delivery is currently email-only.

Pickup OTP delivery uses the BMS/mNotify quick-SMS endpoint with `recipient` as an array,
`sms_type: "otp"` and the JSON boolean `is_schedule: false`, matching
[BMS OTP documentation](https://bms.africa/otp). The OTP flag uses the provider's main wallet,
which is billed separately from SMS credit bundles. The app's SMS-balance lookup does not
verify that main-wallet balance. Enabling a branch's OTP requirement does not select or
configure an SMS provider: the company still needs an active default SMS provider, an enabled
API key and an approved sender ID.

A pickup OTP request only succeeds after SMS dispatch reports provider acceptance. Missing
configuration, no default provider, provider rejection or a dispatch exception returns HTTP 503
and expires the newly generated undelivered OTP, so a fresh attempt is possible. The failed
notification dispatch remains visible with its error for diagnosis. A failed forced resend does
not invalidate a previous successfully sent OTP. Existing code expiry/verification rules and
parcel/payment state remain unchanged. Provider acceptance is not proof of handset delivery;
use BMS delivery reports to investigate messages accepted but not received. `log_only` remains
a simulation provider and does not send a real SMS.

Previously, the pickup OTP endpoint discarded the SMS dispatch result and could return success
for a failed send. This is corrected in the application source; production delivery and current
wallet/provider settings must be checked separately. Codes created by the previous behavior
retain their five-minute expiry or can be replaced through the existing forced-resend action.

QA: mock missing/default-provider/configuration errors, provider rejection and thrown transport
errors; expect HTTP 503, failed-code expiry and no parcel/payment changes. Retry after fixing
configuration; verify success only after provider acceptance. Force resend with an existing valid
OTP and a failed replacement; verify only the replacement is expired. Confirm OTP requests use
boolean `is_schedule: false` and `sms_type: "otp"`; ordinary SMS keeps the OTP flag absent.
Coverage: `otp-sms-delivery.test.ts` and `sms-provider-payloads.test.ts`.

Reusable templates and new bulk SMS messages support `{{senderName}}`, `{{senderPhone}}`,
`{{recipientName}}`, `{{recipientPhone}}`, `{{branch}}`, `{{location}}`, `{{locationName}}`,
`{{locationPhone}}`, and `{{date}}`.
Sender, branch, and location values resolve from the user dispatching the campaign; recipient values
resolve from each audience record. A missing value resolves to an empty string. `{{companyId}}` is
not supported. Unknown variables are rejected when a template or campaign is saved, before any
messages are dispatched. This behavior is shared by the web template editor and bulk SMS composer.

QA scenarios:

1. Create a bulk SMS containing all nine supported variables; verify sender details and operational
   assignment come from the dispatching user and recipient details come from each audience record.
2. Send the same template as a user without a location; verify the message is dispatched with an
   empty location value.
3. Enter `{{companyId}}` or another unsupported token; verify the editor rejects the message.
4. Add `{{branch}}` and `{{location}}` to a transactional parcel definition; verify the dispatched
   message contains the parcel's destination branch and pickup or queue location.
5. Request and resend a receiver pickup OTP through mNotify; verify both provider requests include
   `sms_type: "otp"`. Send a queue ticket and bulk SMS; verify neither includes `sms_type`.

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

The event response includes `parcelId`, `trackingCode`, `sentCount`, `failedCount`, and
`failures: { channel, recipientType, message }[]`. Each failed SMS/email attempt has a
failure entry identifying the channel and main or second receiver, without returning contact
addresses. Provider diagnostics are bounded to 500 characters and API query credentials are
redacted. Successful sends return an empty failure list. Missing contact addresses retain the
existing skip behavior; they do not count as provider failures.

The single-parcel web Call Outcome warning (also used by desktop) displays these failure reasons
for ten seconds. Older backend responses containing only counts show guidance to check Dispatch
Logs. A notification failure leaves the saved outcome intact; closing the dialog and refreshing
queues do not automatically resend the message. Bulk and mobile clients continue using their
existing count-based feedback; the API fields are additive.

### mNotify HTTP errors

Quick SMS requests use the [BMS documented endpoint and JSON format](https://developer.bms.africa/),
with `Accept: application/json`. HTTP 5xx responses, including HTML error pages containing
monitoring scripts, are recorded as readable mNotify service errors. A 5xx response does not
confirm whether the provider accepted the SMS. Check mNotify delivery reports before manually
retrying; if service errors persist, contact mNotify support with the failure time and endpoint.
The app makes one request and does not automatically retry billable sends. Non-5xx JSON errors
retain their provider message with the API key redacted; non-JSON errors use a readable fallback.
This transport behavior applies to all mNotify SMS callers, including pickup OTPs. It does not
resolve an outage or account problem at the provider, and local tests do not establish live
delivery or deployment status.

### Resending saved call outcomes

On web/desktop Parcel Status (Call Receivers), enable **Include saved outcomes**, search for the
booking, and choose **Resend Notification** from its row menu. The default queue still shows only
uncalled assigned parcels. Including saved outcomes preserves server pagination, assignment,
branch, search, and payment filters; contacted rows cannot be selected for another bulk outcome.
The resend dialog shows the saved outcome read-only, defaults SMS on/email off, and optionally
includes the saved second receiver (default on when present). At least one channel is required.
Sending disables the controls and guards against a second click while the request is pending.
Success closes the dialog; failed or zero-send attempts leave it open with diagnostic feedback.

`POST /events/parcel-status-call/resend` requires the Notification Hub module and either
`CanSendCallCenterNotifications` or `CanReadCallCenterParcelStatus`. It rechecks the authenticated
company, destination branch, current call-center assignee, non-deleted parcel, call timestamp,
and expected outcome before sending. Only saved Awaiting Pickup, Home Delivery Requested, or
Customer Contacted outcomes are eligible. Changed, uncalled, or progressed outcomes return 409;
missing/out-of-scope parcels return 404; missing context or both channels disabled returns 400.
Each explicit resend creates new dispatch history and an audit entry with `isResend: true`.
It uses current saved recipients and configured templates without updating the parcel outcome,
call timestamp, assignments, receiver details, or payments. It is a manual new send, including
previously successful recipients when selected, with no automatic retries. Mobile has no new
resend control; its existing save workflow is unchanged. No migration is required.

## Location name and telephone SMS variables

All application SMS event definitions and bulk SMS templates expose `{{locationName}}`
and `{{locationPhone}}`. The variable buttons are generated from the shared/event catalogs,
including previously customized events. Existing bodies are preserved; edit a template to
include the new tokens. Unknown variables remain rejected and OTP bodies still require `{{otp}}`.

Each location has its own optional `telephone` (maximum 30 characters, stored as text to
preserve leading zeroes and international prefixes), editable in Locations on web/desktop.
Apply migration `0089_location_telephone` before running the updated backend; existing rows
remain null until configured. See [location contact settings](PLATFORM_AND_ACCESS.md#location-telephone).
There is no fallback to the branch telephone: `{{branchPhone}}` keeps its existing meaning.

- Bulk/campaign SMS uses the dispatching user's assigned active location in their company/branch.
- Call outcomes, resends, and receiver OTP use the parcel's assigned active pickup location
  in its company/destination branch. Both receiver choices use the same location contact.
- Queue tickets use the queue location contact. With no queue location, the existing branch-name
  location label remains, while locationPhone is empty. A deleted or out-of-scope assigned
  queue location rejects ticket creation before queue or SMS changes.
- Digital receipts use the assigned pickup location name/telephone. The legacy `{{location}}`
  still uses the receipt's pickup label or home-delivery address; `{{locationName}}` identifies
  the pickup location even for home delivery. No assigned pickup location means empty new tokens.
  Contact data is resolved when generating messages; the public receipt summary is unchanged.

`{{location}}` remains a compatible name alias for bulk/ordinary parcel SMS. Missing location
or telephone renders as an empty string without an unresolved token. Lookup rejects foreign,
mismatched-branch, or deleted locations rather than using another location's contact.
No new sending permissions or module gates are introduced. Native mobile dispatches use the
same server variables; no native location-management or SMS-template screen is added.

Validation: `tests/utils/sms-template-variables.spec.ts`, `campaign-template-values.test.ts`,
`sms-event-definitions.test.ts`, `services/sms-location-variables.test.ts`, receipt message tests,
and `tests/server/sms-location.spec.ts` cover catalog acceptance, rendering, saved text values,
clearing/omission, migration idempotence and scoped lookups. Integration tests require
`SMS_LOCATION_TEST=1 TEST_DATABASE_URL=postgres://localhost/vipex_sms_location_test` against
that dedicated empty local database; its tables are dropped after testing. SMS dispatch tests
mock the provider and send no real messages.
