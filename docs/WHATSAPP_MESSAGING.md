# WhatsApp Messaging

Status: implemented and deployed (web + server, merged to `main`). Mobile Waiting for Pickup
now includes collection-OTP channel selection; device validation is tracked in the
[mobile smoke checklist](MOBILE_QA_SMOKE_CHECKLIST.md#waiting-for-pickup).
Go-live checklist: [Going live](#going-live).

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

`config_json` keys: `phoneNumberId`, `wabaId`, `apiVersion` (default `v24.0`; previously `v21.0`), `accessToken`, `appSecret`, `webhookVerifyToken`.

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

- New pickup codes expire in the application after 10 minutes. The WhatsApp authentication
  template's displayed expiry is configured in Meta and should match the application lifetime.

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
| POST     | `/v1/whatsapp/settings/test`              | as provider; sends a chosen template with sample values (see below)             |
| GET      | `/v1/whatsapp/spend?from=&to=`            | auth + (`CanViewWhatsAppSpend` or `CanManageCompanyModules`) + module           |
| PUT      | `/v1/whatsapp/spend/rates`                | auth + `CanManageCompanyModules` + module                                       |
| DELETE   | `/v1/whatsapp/spend/rates/:id`            | auth + `CanManageCompanyModules` + module                                       |
| GET/POST | `/v1/public/whatsapp/webhook`             | public; verify token / signature                                                |

## Test message

`POST /v1/whatsapp/settings/test` body: `{ phone, template? }`.

- `template` is an application event code (for example `digital_receipt_booking`) or `hello_world`. Default: `digital_receipt_booking`.
- An event code uses the company's resolved template name/language (override → default) filled with fixed sample values: `Test Customer`, `TEST-0001`, `GHS 0.00`, `GHS 0.00`, `Test destination`, receipt URL suffix `test`, OTP `123456`.
- `hello_world` sends Meta's sample template. Meta only accepts it from its public test numbers (error `131058` from a real business number).
- The response returns `providerMessageId`, `templateName`, `language`. Nothing is written to the dispatch log.
- Unknown `template` → 400 "Unknown WhatsApp test template". Meta rejections → 400 with Meta's code and message.
- UI: the test card on the Provider tab has a template picker (the four events plus `hello_world`), defaulting to the booking receipt. A template only succeeds once Meta has approved it on the same WhatsApp Business Account as the phone number.

## Failure cases

| Case                                | Result                                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| Missing token/phone number ID       | dispatch `failed`: "WhatsApp provider is missing configuration"                                     |
| Template not approved / wrong name  | dispatch `failed` with Meta's error code (e.g. 132001)                                              |
| Number not on WhatsApp              | accepted by Meta, then webhook marks `failed` (e.g. 131026)                                         |
| Invalid stored number               | dispatch `failed`: "Invalid WhatsApp number"                                                        |
| Webhook bad signature               | 403, no writes                                                                                      |
| Number not registered for Cloud API | `133010` Account not registered (number still only on the WhatsApp Business app, or not registered) |
| `hello_world` from a real number    | `131058`; use one of the application templates instead                                              |
| No payment method on the WABA       | Meta payment/eligibility error; add a card in WhatsApp Manager                                      |

## Clients

- Web: settings page and OTP toggle.
- Desktop (Electron): same as web (loads the web app).
- Mobile Waiting for Pickup sends `channel` for collection OTPs, defaulting to SMS and showing
  WhatsApp only when availability reports it enabled/configured. Other mobile WhatsApp
  administration and receipt workflows are not added. See [Mobile Office Pickup](MOBILE_OFFICE_PICKUP.md).

## Operational notes

- Apply the complete migration journal in order: `0083_parcel_search_indexes`,
  `0084_whatsapp_messaging`, then `0085_digital_receipts` (and later `0093_whatsapp_billing_rates` for the spend report). The WhatsApp branch includes the
  existing parcel-search index migration so a standalone deployment does not advance past it;
  Drizzle skips older migrations once a later timestamp has been applied. QA: migrate a database
  at `0082` and verify both parcel-search indexes, the OTP channel column, dispatch message index,
  customer receipt preferences, and receipt share links exist.
- One Meta app can serve several companies. Each company's provider row must carry its own `phoneNumberId` so webhooks map to the right company.
- The public webhook is subject to the global IP rate limiter.
- Meta charges per conversation/message. Authentication-category templates (OTP) are billed separately from utility templates (receipts).

## Spend report

Page: `/settings/whatsapp/spend` (sidebar: Platform Configuration → WhatsApp Spend). Permission `CanViewWhatsAppSpend` plus the `whatsapp_messaging` module. Web and desktop only.

Purpose: a bill for the client for a period (this month, last month, or a custom range of up to one year), exportable as CSV and printable.

### Client bill (everyone with access)

- Totals: messages sent, delivered, failed, billable, awaiting confirmation, and **amount due**.
- By message type (pickup code, booking/payment/home delivery receipt) and by day.
- Amount = billable messages × the client price for the message type: pickup code → authentication price, receipts → utility price (other messages fall back to Meta's category; `service` and unknown cost 0). Prices follow our message type, not Meta's category, because Meta can report free messages as `service`.
- **Billable to the client = every delivered or read message, plus any message Meta marked `pricing.billable = true`.** This includes messages Meta delivered **free** (for example inside a customer service window): the client still pays the client price and the whole amount is margin. Meta's per-message pricing (`billable`, `category`, `type`) is stored on the dispatch as `metadata_json.whatsappPricing` when the status webhook arrives.
- Delivered messages without pricing data (sent before this feature, or before webhooks were connected) are counted as `estimated`. Messages still `sent` and not marked billable are `unconfirmed` and not billed. Failed messages are never billed.
- The count of free-from-Meta messages (`free`) is internal: it is returned only to `CanManageCompanyModules` users, shown on the Meta cost card, and left out of the CSV and the client view.
- Dates are calendar days on `notification_dispatches.created_at` (UTC; Ghana is UTC).
- Test-card messages are not logged, so they never appear on the client bill.

### Billing prices and Meta cost (`CanManageCompanyModules` only)

- **Billing prices** dialog: price history plus a form for a new price with a **start date** (`effectiveFrom`, default today), currency (3-letter code, default USD) and price per message for authentication (pickup code), utility (receipt), marketing (0–100). Stored in `whatsapp_billing_rates` (migration `0093`), one row per company and start date (unique), rates in micro-units.
  - Each message is billed at the price with the latest start date **on or before the day it was sent**. A new price never changes earlier days, so past invoices stay stable. Saving a price for a start date that already exists replaces it; a start date in the past changes reports from that day (the dialog warns).
  - All prices share one currency; saving a different currency while other periods exist is rejected (delete them first).
  - Messages sent before the first start date are billable but priced at 0 and counted as `unpriced` (managers see a notice).
  - Price periods can be deleted (confirmation; those days fall back to the previous price). Audit actions `WHATSAPP_BILLING_RATES_SAVED` / `WHATSAPP_BILLING_RATES_DELETED`.
  - The report returns `prices: { currency, isConfigured, current, history }`; `current` is the price in force on the last day of the period. On the by-type table, a price that changed within the period shows the latest price with "price changed in period" (CSV: `varies`).
- **Meta cost** card: what Meta charged the WhatsApp Business Account for the period, read live from `GET /{wabaId}?fields=currency,pricing_analytics.start().end().granularity(DAILY).dimensions(["PRICING_CATEGORY"])`, summed by category, plus margin (amount due − Meta cost, only when the currencies match). Requires the WhatsApp Business Account ID in WhatsApp Settings. Meta data can lag a few hours and covers the whole account (including test messages). If Meta fails, the card shows the error and the bill still loads.
- Other viewers never receive `metaCost` or `margin` (both `null`), and the card is hidden when printing.

### Failure cases

| Case                         | Result                                           |
| ---------------------------- | ------------------------------------------------ |
| Bad date / end before start  | 400                                              |
| Period longer than one year  | 400 "Choose a period of one year or less"        |
| No billing prices saved      | Amounts are 0; page shows a notice               |
| Missing WABA ID / Meta error | Meta cost card shows the reason; bill unaffected |
| Invalid currency or price    | 400 on save                                      |
| Currency differs from others | 400 "All prices must use the same currency"      |
| Delete unknown price period  | 404                                              |

## Going live

Checklist used for the first production setup (November 2026):

1. Meta app of type Business with the WhatsApp use case; permissions `whatsapp_business_messaging` and `whatsapp_business_management` (standard access is enough for the company's own number).
2. System user (Admin) assigned the app and the WhatsApp Business Account with full control, and listed under the app's **App roles → Roles**. Token: expiry Never, the two WhatsApp permissions only.
3. Dedicated number on the Cloud API WhatsApp Business Account, shown as **Registered** in the dashboard. A number still in use on the WhatsApp Business app shows **Offline** and fails with `133010`; using one number on both (coexistence) needs Meta's Embedded Signup, which requires Tech Provider status and is not implemented here.
4. Templates created and approved on the **same** WhatsApp Business Account as the number.
5. Payment method on that account; business verification started (raises message limits).
6. Webhook callback URL and verify token saved in the app first, then **Verify and save** in Meta, then **Subscribe webhooks** on the account. The Meta app must be **published** or Meta only delivers dashboard test webhooks (no real status updates).
7. Provider saved in Settings → WhatsApp with the Graph API version shown in Meta's dashboard; send a test with an approved template.

Current production: VIPEX sends from a dedicated number (+233 53 264 9350). The company's existing WhatsApp Business app number stays on the phone for staff chats and is not connected to the API.

## Tests

- `src/server/utils/phone-msisdn.test.ts`
- `src/server/features/notification-hub/providers/whatsapp-cloud-provider.test.ts` (payload, transport, token redaction, signature)
- `src/server/features/whatsapp-messaging/webhook-status.test.ts` (status parsing and forward-only transitions)
- `src/server/features/parcel-receiver-otp/otp-channel.test.ts` (WhatsApp refused when disabled or unconfigured)
- `src/server/features/whatsapp-messaging/test-message.test.ts` (test message sample values, template override, OTP sample code)
- `src/server/features/whatsapp-messaging/spend-summary.test.ts` (delivered free messages still billed, failed/unconfirmed never billed, estimated delivered messages, prices by message type, daily grouping, price periods by start date, later prices never change earlier days, unpriced messages before the first price)
- `src/server/features/whatsapp-messaging/meta-pricing-analytics.test.ts` (UTC day window capped at now, category sums, request URL, token redaction)
- `src/features/platform-configuration/whatsapp-spend/utils/spend-utils.test.ts` (period presets, CSV rows)
- `webhook-status.test.ts` also covers pricing parsing

QA scenarios for the spend report:

1. Send a pickup code and a receipt; after delivery the dispatch rows have `metadata_json.whatsappPricing` and the report shows both as billable at the configured prices.
2. A user with only `CanViewWhatsAppSpend` sees the bill but no Meta cost card or Billing prices button; the API returns `metaCost: null`.
3. Export CSV and Print produce the same totals as the page; the Meta cost card is not printed.
4. Remove the WABA ID: the Meta cost card shows the reason and the bill still loads.
5. A delivered message with `whatsappPricing.billable = false` is on the client bill at the client price; managers see it in the Meta cost card's free count; a client viewer's API response has no `free` field.
6. Set a price from the 1st, bill a month, then add a higher price from the next month: the earlier month's report total is unchanged and the new month uses the higher price.
