# Digital Receipts

Status: implemented on branch `feature/whatsapp-receipts` (web + server). The public page lives in `vipex_website` (`/receipt/:token`). Mobile is not implemented.

## Purpose

Customers choose how they receive receipts: **Physical, SMS, WhatsApp, Email** (any combination). Digital receipts carry:

- a short text summary quoting the **booking code** (not the tracking code), amount paid, balance and destination
- a secure link to an online copy that matches the printed receipt (the A5 receipt, or the "to be paid" acknowledgement note when nothing was paid), except that **phone numbers are masked**

## Module

- Code: `digital_receipts`, depends on `notification_hub`
- The WhatsApp option also requires [`whatsapp_messaging`](WHATSAPP_MESSAGING.md) to be enabled and configured
- When the module is off, no picker is shown, nothing is sent, printing is unchanged, and existing links return 404

## Receipt kinds

| Kind               | Document                                 | Recipients                                                                             | Built from                                                              |
| ------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `booking`          | Sender A5 receipt, or ack note if unpaid | Sender                                                                                 | parcel row + recorded sender payment                                    |
| `sender_payment`   | Sender A5 receipt                        | Sender                                                                                 | same                                                                    |
| `receiver_payment` | Receiver cashier A5 receipt              | Main receiver                                                                          | recorded receiver principal + storage payments; issued at `confirmedAt` |
| `home_delivery`    | Home delivery A5 receipt                 | Delivery recipient (receiver), plus the sender when the sender paid part of the charge | `buildHomeDeliveryReceiptSvc`                                           |

Recipients are de-duplicated by customer/phone.

## Parity with the printed copy

The server renders the **same React templates** used for printing (`InvoiceA5Template`, which switches to `ToBePaidReceiptA5Template`, and `HomeDeliveryReceiptA5Template`). It does this with `renderToStaticMarkup`, using the A5 page style and `createPrintableHtmlDocument`.

Template props come from shared pure mappers, so the print dialog and the online copy cannot drift:

- `buildInvoiceA5Props` / `computeParcelReceiptTax` (`src/features/operations/parcel/utils/build-invoice-a5-props.ts`), used by `ParcelReceiptPrintContent`
- `buildHomeDeliveryReceiptA5Props` (`.../utils/build-home-delivery-receipt-props.ts`), used by `HomeDeliveryReceiptPrintController`

Other details:

- The QR code renders as SVG and the logo is an embedded data URI.
- Dates use the fixed `Africa/Accra` formatter, the same as printing.
- The online copy is never marked "DUPLICATE" and has no cashier name. Home delivery receipts use the link creation time as the issue time (the printed copy uses print time).

## Customer preference

- `customers.receipt_delivery_channels text[]`, default `{physical}` (migration `0085`).
- The picker starts from the paying customer's saved channels. When the staff member's choice differs, it is saved as the new default.

## Where staff choose

| Screen                                               | Behaviour                                                                                                                                                                                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New booking → Receipts card                          | Picker (sender's default) + **Send digital receipt** button. Paid parcels send `sender_payment`, unpaid send `booking`. Physical copies use the existing print buttons. Works for new customers because it appears after the booking is saved. |
| Sender Cashier Payments → Collect dialog             | Picker in the dialog; on success sends `sender_payment` (or `booking` when nothing was due). If **Physical** is unticked, the auto-print is skipped.                                                                                           |
| Receiver Cashier → payment & delivery dialog         | Picker shown when the receiver pays something. On success it sends `receiver_payment`. Unticking Physical skips the auto-print.                                                                                                                |
| Home Delivery Dispatch → row menu → **Send receipt** | Send dialog preset to the home delivery receipt.                                                                                                                                                                                               |

The booking, sender payment and receiver payment are saved **before** any digital send. A failed digital send only shows a warning toast and never undoes the transaction.

Super Search → View Details also offers **Send receipt** for a non-deleted parcel when the
module is enabled and the user has one of the receipt API permissions listed below. The dialog
loads on demand and supports booking/sender, receiver payment, and home delivery receipts.
Unavailable receipt kinds are rejected by the send API without sending a message. Sending or
closing the receipt dialog leaves parcel details open.

## Sending

`POST /v1/digital-receipts/parcels/:id/send` `{ kind, channels[] }` (`physical` is ignored):

1. Builds the receipt (validates the parcel is eligible for that kind; e.g. `receiver_payment` needs a recorded receiver payment).
2. Creates one `receipt_share_links` row. The token is 32 random bytes as hex; only its sha256 is stored. It expires after 180 days.
3. For each recipient × channel:
   - SMS: `dispatchSmsEventSvc` with events `digital_receipt_booking` / `digital_receipt_payment` / `digital_receipt_home_delivery`. These are editable in SMS Configuration and use the variables `customerName, bookingCode, amountPaid, balance, destination, receiptUrl, branch, location, locationName, locationPhone`. The new locationName/locationPhone quote the assigned pickup location contact; legacy location keeps its existing pickup-label/home-delivery-address meaning. Missing pickup contacts render empty.
   - WhatsApp: `dispatchWhatsAppEventSvc` with the same event codes; the URL button carries the token.
   - Email: platform SMTP (`sendMail`) with an HTML/text email containing the summary and a "View your receipt" button. It is logged in `notification_dispatches` with `channel = 'email'` and `provider_key = 'smtp'`.
4. Returns `{ shareLinkId, url, expiresAt, results[] }`. Each result is `sent | failed | skipped` with a detail, e.g. "No email on file", "No phone on file", or "WhatsApp is not enabled or configured".

Link format: `${PUBLIC_RECEIPT_BASE_URL}/<token>` (env, default `https://vipexparcels.com/receipt`).

## Public receipt endpoint

`GET /v1/public/receipts/:token` (public, rate-limited, CORS open like public tracking):

- Returns `{ kind, bookingCode, issuedAt, summary: { amountPaidCedis, balanceCedis, destinationBranch, destinationLocation }, html }`. The response may be wrapped in `{ data }` like other endpoints.
- The receipt is rebuilt from **current recorded data** each view, then the view is counted (`view_count`, `last_viewed_at`).
- Malformed tokens, unknown or expired links, a disabled module, and a parcel no longer eligible for that kind all return the same 404: "Receipt not found or the link has expired".
- `html` is a complete document; the website shows it in a sandboxed iframe with print/save-as-PDF.
- **Contact masking:** anyone holding the link can open it, and links can be forwarded, so the
  online copy masks every sender, receiver and payer phone number. Each number keeps its first
  three and last two digits (`0244123456` → `024*****56`); both numbers in a "primary, secondary"
  pair are masked, and placeholders such as `-` are unchanged. Names, booking/tracking codes,
  amounts and the home-delivery address are not masked. Printed counter receipts and the in-app
  print dialog still show full numbers. Implemented in
  `src/server/features/digital-receipts/mask-receipt-contacts.ts`, applied only in
  `getPublicReceiptSvc`.

## Other API

| Method | Path                                             | Purpose                                    |
| ------ | ------------------------------------------------ | ------------------------------------------ |
| GET    | `/v1/digital-receipts/customers/:id/preference`  | `{ channels, hasPhone, hasEmail }`         |
| PUT    | `/v1/digital-receipts/customers/:id/preference`  | save default channels (empty → `physical`) |
| GET    | `/v1/digital-receipts/parcels/:id/options?kind=` | recipients + payer's default channels      |
| POST   | `/v1/digital-receipts/parcels/:id/send`          | send/resend                                |

Guard for all four: auth + module + any of `CanCreateParcels`, `CanCreateSenderPayments`, `CanCreateReceiverPayments`, `CanCompleteOfficePickup`, `CanDispatchForDelivery`, `CanReadParcels`.

## Clients

- Web and Desktop: as above.
- Website (`vipex_website`): `/receipt/:token` and `/r/:token` render the returned HTML.
- Mobile: not implemented. Bookings made on mobile can be sent from the web.

## Tests

- `src/server/features/digital-receipts/render/render-receipt-html.test.ts`: paid receipt, ack note, home delivery render server-side (SVG QR, embedded logo, A5 page style, no scripts)
- `recipients.test.ts`, `message-summary.test.ts` (booking code quoted, never the tracking code; all kinds have SMS + WhatsApp events)
- `public.service.test.ts`: malformed token, hash lookup, expiry, module-disabled, view recording
- Existing `parcel-receipt-print-content.test.tsx` covers the shared print mapping
- `src/features/digital-receipts/components/send-receipt-action/send-receipt-action.test.tsx`:
  Super Search send action visibility for authorized staff, disabled modules, missing permissions,
  and deleted parcels

## QA scenarios

1. Enable `notification_hub`, then `digital_receipts`. Create a sender-paid booking for a customer with phone and email. Tick SMS + Email, send. Two dispatches are logged, and the link shows the same receipt as the printed A5.
2. Receiver-pays booking: send. The link shows the "to be paid" acknowledgement note.
3. Untick Physical in the Sender Cashier dialog and collect: no print dialog opens, and the digital receipt is sent. Next payment for the same customer defaults to the saved choice.
4. Receiver cashier with a payment due: tick WhatsApp (module configured). The WhatsApp dispatch moves to `delivered` after the webhook.
5. Open an expired or tampered link: 404 page.
6. Disable `digital_receipts`: pickers disappear, the API returns 403, and old links return 404.
7. Super Search → View Details → Send receipt: choose a receipt kind and available channels,
   send/resend, and confirm the dispatch results and online copy. Close the send dialog and verify
   parcel details remain open. An unavailable receiver/home delivery receipt shows an error.
8. Verify the Super Search action is absent with the module disabled, without any receipt API
   permission, and for a deleted parcel. Opening another parcel uses its own booking and recipients.
