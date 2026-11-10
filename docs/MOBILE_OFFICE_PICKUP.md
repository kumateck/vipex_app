# Mobile Office Pickup

## Scope and entry

**Waiting for Pickup** opens `/(app)/office-pickup` (native screen `OfficePickup`) from the
sidebar's **Operations** section or the **Operations Hub**. Both entries and the screen
require `CanCompleteOfficePickup`, matching
web/desktop `/parcels/waiting-pickup`. The feature lives in
`apps/mobile/src/features/operations/office-pickup/` and shares the existing `/v1` APIs.
Android and iOS use the same feature. Native device smoke testing remains required.

This completes office handover without collecting payment. Parcels with outstanding principal
or storage charges belong in Receiver Cashier. Mobile Receiver Signatures captures signatures for payments already processed in Receiver Cashier. See [Receiver Cashier signatures](RECEIVER_CASHIER_SIGNATURES.md). Mobile receiver-payment collection, receipt
printing and the full web cashier table are not implemented by this feature.

## Finding a parcel

- An assigned company and branch are required. Branch operational settings must load before
  searching; failure shows a retry action and does not assume OTP is disabled.
- Search accepts a full or partial booking code, tracking code, sender or receiver name, or
  either stored phone number for the sender or receiver. Results show both parties so staff
  can identify the parcel before opening it.
- **Scan sticker** reads the parcel QR, extracts the code from a tracking URL or legacy
  `QR-` payload, and immediately looks up the exact code. Bare codes are also accepted.
  Tap a matching parcel to open its details. Multiple parcels can share a booking code.
  An unknown or ineligible code returns no results. Manual search remains available if
  camera access is denied. Deploy the server's `parcelCode` filter before shipping this app build.
- The query fixes company and destination branch, `status=AWAITING_PICKUP` and
  `cashierCollectionRequired=false`. No payment-method filter is sent: eligibility depends on
  the remaining balance, even though the UI calls these sender-paid parcels.
- With `usePickupQueue=true`, the initial list is restricted to queued parcels. A search drops
  that queue filter so staff can also find a parcel without a ticket. Handover still requires
  a ticket when queues are enabled; create it through the separate Queue workflow.
- Awaiting Pickup results show an active ticket’s queue number only when pickup queues are
  enabled for the branch. Turning queues off hides numbers even on parcels with older tickets.
- With queues disabled, staff must search or scan before results load. Results are limited to
  the first 20 matches; there is currently no paging/load-more control. Narrow a search when
  needed. Mobile does not send an explicit sort.

## Handover and identity

Opening a result loads parcel details, active location staff, card types and existing main/
second receiver cards in parallel. Required-resource failure shows retry/back controls and
blocks completion. The shelf picker is initialized from the parcel, then its queue ticket;
an existing assignment is read-only. Otherwise select active staff at the signed-in location.
An account without a location cannot load staff choices.

Select Main receiver or Second receiver; a linked second receiver is selected initially.
If a second receiver is not linked, enter a name and exactly ten telephone digits. The
resolve endpoint reuses an existing company customer or creates one. Each receiver's ID card
may be omitted, chosen from saved cards, or entered as a card type and number. Selecting an
existing card requires a current saved-card record; a new card requires both fields.

When `requirePickupOtp=true`, send a six-digit collection OTP to the **main receiver**, even
when the second receiver collects. Choose their primary or stored secondary telephone.
SMS is the default; WhatsApp is offered only when availability reports it enabled/configured.
An availability lookup failure leaves SMS available. Choosing another channel affects the
next send and preserves an already sent code. Changing collector or phone slot clears local
OTP state; reopening a parcel clears the form and verification state.

The code countdown uses the request's five-minute expiry. Successful resend uses `force=true`
and clears local code/verification. Verification returns an opaque token; the server gives
that token a ten-minute lifetime and rejects expired/consumed tokens at completion. The
mobile verified badge does not track this token expiry; request and verify another code if
the server rejects it. An existing active code after reopening can produce a conflict on the
first send; there is no dedicated force-resend recovery control for that conflict yet.
When branch pickup OTP is disabled, the screen shows a warning and omits OTP fields.

Tap **Capture signature** and ask the selected collector to sign with a finger. The dialog
uses the rider delivery drawing pad. **Clear** starts the drawing again and **Save signature**
keeps the drawing on the form. A tap without a stroke cannot be saved. Changing collector,
editing a new second receiver’s details or reopening the parcel requires a fresh signature.

Confirmation requires a shelf picker, any required queue ticket, OTP when enabled, and the
collector’s signature. Local validation happens before writes. Submission saves new cards,
resolves a new second receiver when needed and sends the signed confirmation. Collecting as the
main receiver retains a linked second receiver and clears second-card handover fields.
Success shows a confirmation card and refreshes the search results.
**Request home delivery** instead PATCHes `HOME_DELIVERY_REQUESTED`, closes the panel and
refreshes results without office OTP confirmation or collecting payment.

## API and permission dependencies

All paths below have the `/v1` prefix. Signed pickup uses the existing office pickup permission and database schema.

| Request                                                    | Existing gate / behavior                                                                                                                                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /branches/:id/operations-settings`                    | Authentication; own branch, or branch-read access within company. Reads `usePickupQueue` and `requirePickupOtp`.                                                                                                                            |
| `GET /shipments/parcels`                                   | Parcel read (the endpoint also accepts call-center assignment read); client narrows to company/destination branch and eligible balance/status.                                                                                              |
| `GET /shipments/parcels/:id/details`                       | `CanReadParcels`; required handover resource.                                                                                                                                                                                               |
| `GET /users/options`                                       | `CanReadUsers`; active company/branch/location staff.                                                                                                                                                                                       |
| `GET /customers/cards/options`, `GET /customers/:id/cards` | `CanReadCustomers`; required handover resources.                                                                                                                                                                                            |
| `GET /whatsapp/availability`                               | Authentication; returns company availability, SMS fallback on failure.                                                                                                                                                                      |
| `POST /payments/receiver-otp/request`                      | Receiver-payment or office-pickup permission. Sends `{ parcelId, targetReceiver: 'main', phoneSlot, channel, force }`; returns `{ expiresAt, channel }`.                                                                                    |
| `POST /payments/receiver-otp/verify`                       | Same permission alternatives; sends `{ parcelId, targetReceiver: 'main', otp }`; returns `{ verificationToken, expiresAt }`.                                                                                                                |
| `POST /customers/:id/cards`                                | `CanUpdateCustomers`; saves a new card before final handover.                                                                                                                                                                               |
| `POST /customers/resolve-second-receiver`                  | `CanCreateCustomers`; sends `{ fullname, telephone }` and uses returned `id`.                                                                                                                                                               |
| `POST /shipments/parcels/:id/confirm-office-pickup`        | `CanCompleteOfficePickup` and authenticated company/destination branch. Accepts `signatureImage`, `handoverTarget`, `confirmedBy`, nullable second receiver and card fields, and an OTP verification token when required. Returns `{ id }`. |
| `PATCH /shipments/parcels/:id`                             | **Request home delivery** sends only `HOME_DELIVERY_REQUESTED`.                                                                                                                                                                             |

Office-pickup permission alone shows the screen but does not grant these helper permissions.
Missing required read grants leave details unavailable; missing customer mutation grants fail
the selected card/contact action.

## Failures, recovery and client differences

OTP request/verify failures display the API error and do not mark verification successful.
The server checks branch OTP policy, verified token, principal/storage settlement and open
reconciliation cases again before office delivery. Provider failure returns 503 and expires the
new code; invalid codes, expiry and excessive attempts require correction or another code.
See [Parcel operations](PARCEL_OPERATIONS.md#receiver-otp) for shared delivery rules.

Card creation, contact resolution and signed confirmation are separate requests. A later failure
can leave earlier customer/card writes saved while the parcel remains uncompleted; this is
not an atomic payment flow. The error leaves the panel available. Before retrying after an
ambiguous network failure, reopen/refresh to inspect current parcel and saved-card state.
There is no automatic rollback or idempotency key in this mobile submit routine.

The confirmation saves Delivered by Office, the signature and collector identity, active queue
closure and any OTP consumption in one database transaction. The server rejects a missing or
malformed signature and rechecks parcel status, picker, collector and branch rules. It stores the
image in `parcels.delivery_confirmation_snapshot.officePickupSignature`. Parcel history shows the
receiver role that signed without exposing the image. Reversal clears the current snapshot and
retains the audit history. Deploy the signed confirmation endpoint before the mobile build.

The signature is required in the updated Android and iOS handover. Web and Electron use their
existing pickup flow. No mobile receipt printing, payment capture or WhatsApp administration
is added. WhatsApp availability is optional for SMS pickup, and the server remains the
authority for the WhatsApp module/configuration gate.

## Validation

Automated logic coverage lives beside the feature: list/queue scope, OTP input/countdown/
channel fallback, card/contact validation, confirmation gates, payloads, retained second
receivers, signature validation, request ordering and failure propagation. The server integration
suite verifies persisted collector evidence, queue closure, OTP consumption and concurrent submission. Permission and native route mapping
are covered in the existing access-control/navigation suites. Device QA covers the physical drawing interaction.

Run `bun test ./apps/mobile/src/features/operations/office-pickup
./apps/mobile/src/features/access-control/utils/mobile-permission-rules.test.ts
./apps/mobile/src/navigation/navigation-service.test.ts` as one shell command from the root,
then `bun run --cwd apps/mobile typecheck`. Device scenarios are in the
[mobile smoke checklist](MOBILE_QA_SMOKE_CHECKLIST.md#waiting-for-pickup).
