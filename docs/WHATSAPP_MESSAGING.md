# WhatsApp Messaging

Status: implemented on branch `feature/whatsapp-receipts` (web + server). Mobile has no WhatsApp UI yet.

## Purpose

Adds WhatsApp (Meta WhatsApp Cloud API) as a notification channel next to SMS and email. It is used for:

- receiver pickup OTPs, when staff choose WhatsApp instead of SMS
- digital receipts (see [Digital receipts](DIGITAL_RECEIPTS.md))

## Module

- Code: `whatsapp_messaging` (company-scoped, see [Company modules](COMPANY_MODULES.md))
- Depends on: `notification_hub`
- Settings route: `/settings/whatsapp` (sidebar: Platform Configuration → WhatsApp Settings), gated by the module and `CanReadCompanyProfile`

When the module is off, or on but not configured, nothing changes for staff: OTP screens show no channel toggle and send by SMS as before.

## Meta constraint: approved templates only

WhatsApp only delivers business-initiated messages that use a **template approved in Meta WhatsApp Manager**. The platform therefore never sends free text over WhatsApp. Each application event maps to a template name, language, and an ordered list of body parameters (`src/server/features/notification-hub/whatsapp-event-definitions.ts`).

| Event code                      | Category       | Default template              | Body params `{{1}}…`                                        | Button                                               |
| ------------------------------- | -------------- | ----------------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| `receiver_pickup_otp`           | authentication | `vipex_pickup_otp`            | otp                                                         | copy-code (otp)                                      |
| `digital_receipt_booking`       | utility        | `vipex_receipt_booking`       | customerName, bookingCode, amountPaid, balance, destination | URL `https://vipexparcels.com/receipt/{{1}}` (token) |
| `digital_receipt_payment`       | utility        | `vipex_receipt_payment`       | same                                                        | same                                                 |
| `digital_receipt_home_delivery` | utility        | `vipex_receipt_home_delivery` | same                                                        | same                                                 |

Companies can point each event at a different approved template name/language on the Templates tab. Overrides are stored in `notification_templates` with `channel = 'whatsapp'`, `body` = template name, `subject` = language code. Validation: name `^[a-z0-9_]{1,512}$`, language `en` / `en_US` style.

The Templates tab shows a suggested body for each event to submit to Meta.

## Provider configuration

Stored as the company's `notification_providers` row with `channel = 'whatsapp'`, `provider_key = 'meta_cloud'`, `is_default = is_active`.

`config_json` keys: `phoneNumberId`, `wabaId`, `apiVersion` (default `v21.0`), `accessToken`, `appSecret`, `webhookVerifyToken`.

Environment fallbacks (used when a key is blank in `config_json`): `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`, `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

Secrets are write-only:

- `GET /v1/whatsapp/settings` returns only `hasAccessToken` / `hasAppSecret` / `hasWebhookVerifyToken`.
- Saving with a blank secret keeps the stored value.
- `GET /v1/notification-hub/providers[/:id]` masks WhatsApp secrets as `••••••••` (other channels are unchanged).

"Configured" means: provider row active + default, with an access token and phone number ID (row or env).

## Sending

`dispatchWhatsAppEventSvc` (`notification-hub/services/whatsapp-events.service.ts`):

1. Resolves template name/language (company override → default).
2. Builds ordered body params; blanks become `-` (Meta rejects empty params).
3. Writes a `notification_dispatches` row (`channel = 'whatsapp'`) whose `body` is a readable preview. OTP values are shown as `[hidden]` and the template payload is not stored for OTPs.
4. Calls `sendWhatsAppTemplate` → `POST https://graph.facebook.com/{apiVersion}/{phoneNumberId}/messages` with a 15 s timeout. Success requires a returned `messages[0].id` (stored as `provider_message_id`).

Phone numbers are converted from stored local format to international digits with `toMsisdn` (`src/server/utils/phone-msisdn.ts`): `0244123456` → `233244123456`; `+`/`00` prefixes and separators are handled; invalid numbers fail the dispatch with `Invalid WhatsApp number`.

Retrying a failed WhatsApp dispatch from the dispatch history re-sends the stored template payload. OTP dispatches cannot be retried (same rule as SMS).

## Delivery status webhook

Public routes (outside `/v1` auth):

- `GET /v1/public/whatsapp/webhook`: Meta subscription handshake. Echoes `hub.challenge` when `hub.mode=subscribe` and `hub.verify_token` matches `WHATSAPP_WEBHOOK_VERIFY_TOKEN` or any company's `webhookVerifyToken`, otherwise 403.
- `POST /v1/public/whatsapp/webhook`: reads the raw body and finds the provider by `metadata.phone_number_id`. Then it verifies `X-Hub-Signature-256` (HMAC-SHA256 with that company's `appSecret`, or the env fallback). On a mismatch it returns 403 and writes nothing.

Status updates match `notification_dispatches.provider_message_id` (indexed, migration `0084`) and only move forward: `sent → delivered → read`. `failed` is recorded unless the message was already read, and the error code/message is stored.

Meta webhook URL to configure: `https://app.vipexparcels.com/v1/public/whatsapp/webhook` (shown on the settings page).

## Pickup OTP over WhatsApp

- `POST /v1/payments/receiver-otp/request` accepts optional `channel: 'sms' | 'whatsapp'` (default `sms`). The response includes the `channel` used.
- `whatsapp` returns 400 if the module is disabled ("WhatsApp Messaging is not enabled for this company") or not configured. No OTP is created in that case.
- The chosen channel is stored on `parcel_receiver_otps.channel` (migration `0084`, default `sms`).
- If WhatsApp does not accept the message, the new OTP is expired and the request fails with 503 (same guarantee as SMS). The message points to WhatsApp Settings.
- Verification is unchanged and channel-independent.
- UI: an SMS / WhatsApp toggle appears in Receiver Cashier and Waiting for Pickup OTP sections only when `GET /v1/whatsapp/availability` reports `available`. Switching channel does not invalidate a code already sent.
- OTP codes now use `crypto.randomInt` (previously `Math.random`).

## API summary

| Method   | Path                                      | Guard                                                                           |
| -------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| GET      | `/v1/whatsapp/availability`               | auth (not module-gated; used by cashier screens)                                |
| GET      | `/v1/whatsapp/settings`                   | auth + `CanReadCompanyProfile` + module                                         |
| PUT      | `/v1/whatsapp/settings/provider`          | auth + (`CanManageNotificationProviders` or `CanManageCompanyModules`) + module |
| PUT      | `/v1/whatsapp/settings/events/:eventCode` | auth + (`CanManageNotificationTemplates` or `CanManageCompanyModules`) + module |
| POST     | `/v1/whatsapp/settings/test`              | as provider; sends Meta's `hello_world` template                                |
| GET/POST | `/v1/public/whatsapp/webhook`             | public; verify token / signature                                                |

## Failure cases

| Case                               | Result                                                          |
| ---------------------------------- | --------------------------------------------------------------- |
| Missing token/phone number ID      | dispatch `failed`: "WhatsApp provider is missing configuration" |
| Template not approved / wrong name | dispatch `failed` with Meta's error code (e.g. 132001)          |
| Number not on WhatsApp             | accepted by Meta, then webhook marks `failed` (e.g. 131026)     |
| Invalid stored number              | dispatch `failed`: "Invalid WhatsApp number"                    |
| Webhook bad signature              | 403, no writes                                                  |

## Clients

- Web: settings page and OTP toggle.
- Desktop (Electron): same as web (loads the web app).
- Mobile: not implemented. Mobile OTP requests omit `channel` and keep using SMS.

## Operational notes

- One Meta app can serve several companies. Each company's provider row must carry its own `phoneNumberId` so webhooks map to the right company.
- The public webhook is subject to the global IP rate limiter.
- Meta charges per conversation/message. Authentication-category templates (OTP) are billed separately from utility templates (receipts).

## Tests

- `src/server/utils/phone-msisdn.test.ts`
- `src/server/features/notification-hub/providers/whatsapp-cloud-provider.test.ts` (payload, transport, token redaction, signature)
- `src/server/features/whatsapp-messaging/webhook-status.test.ts` (status parsing and forward-only transitions)
- `src/server/features/parcel-receiver-otp/otp-channel.test.ts` (WhatsApp refused when disabled or unconfigured)
