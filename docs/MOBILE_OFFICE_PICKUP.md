# Mobile Office Pickup

## Scope and entry

Operations → **Waiting for Pickup** opens `/(app)/office-pickup` (native screen
`OfficePickup`). The card and destination require `CanCompleteOfficePickup`, matching
web/desktop `/parcels/waiting-pickup`. The feature lives in
`apps/mobile/src/features/operations/office-pickup/` and shares the existing `/v1` APIs.
Android and iOS use the same feature. Native device smoke testing remains required.

This completes office handover without collecting payment. Parcels with outstanding principal
or storage charges belong in Receiver Cashier. Mobile receiver-payment collection, receipt
printing and the full web cashier table are not implemented by this feature.

## Finding a parcel

- An assigned company and branch are required. Branch operational settings must load before
  searching; failure shows a retry action and does not assume OTP is disabled.
- Search accepts tracking/booking codes, telephone or receiver name. **Scan sticker** uses the
  shared camera scanner and code parser. Camera access is needed only for scanning.
- The query fixes company and destination branch, `status=AWAITING_PICKUP` and
  `cashierCollectionRequired=false`. No payment-method filter is sent: eligibility depends on
  the remaining balance, even though the UI calls these sender-paid parcels.
- With `usePickupQueue=true`, the initial list is restricted to queued parcels. A search drops
  that queue filter so staff can also find a parcel without a ticket. Handover still requires
  a ticket when queues are enabled; create it through the separate Queue workflow.
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

Confirm requires a shelf picker, any required queue ticket and required OTP verification.
Local validation happens before writes. Submission saves new main-receiver cards, resolves a
new second receiver when needed, saves their new card and finally PATCHes Delivered by Office.
The patch includes the picker as `confirmedBy`, card fields and the second receiver ID.
Collecting as the main receiver retains a linked second receiver but clears second-card
handover fields. Success shows a confirmation card and refreshes the search results.
**Request home delivery** instead PATCHes `HOME_DELIVERY_REQUESTED`, closes the panel and
refreshes results without office OTP confirmation or collecting payment.

## API and permission dependencies

All paths below have the `/v1` prefix. No new endpoint, permission or migration is introduced.

| Request                                                    | Existing gate / behavior                                                                                                                                                                                                          |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /branches/:id/operations-settings`                    | Authentication; own branch, or branch-read access within company. Reads `usePickupQueue` and `requirePickupOtp`.                                                                                                                  |
| `GET /shipments/parcels`                                   | Parcel read (the endpoint also accepts call-center assignment read); client narrows to company/destination branch and eligible balance/status.                                                                                    |
| `GET /shipments/parcels/:id/details`                       | `CanReadParcels`; required handover resource.                                                                                                                                                                                     |
| `GET /users/options`                                       | `CanReadUsers`; active company/branch/location staff.                                                                                                                                                                             |
| `GET /customers/cards/options`, `GET /customers/:id/cards` | `CanReadCustomers`; required handover resources.                                                                                                                                                                                  |
| `GET /whatsapp/availability`                               | Authentication; returns company availability, SMS fallback on failure.                                                                                                                                                            |
| `POST /payments/receiver-otp/request`                      | Receiver-payment or office-pickup permission. Sends `{ parcelId, targetReceiver: 'main', phoneSlot, channel, force }`; returns `{ expiresAt, channel }`.                                                                          |
| `POST /payments/receiver-otp/verify`                       | Same permission alternatives; sends `{ parcelId, targetReceiver: 'main', otp }`; returns `{ verificationToken, expiresAt }`.                                                                                                      |
| `POST /customers/:id/cards`                                | `CanUpdateCustomers`; saves a new card before final handover.                                                                                                                                                                     |
| `POST /customers/resolve-second-receiver`                  | `CanCreateCustomers`; sends `{ fullname, telephone }` and uses returned `id`.                                                                                                                                                     |
| `PATCH /shipments/parcels/:id`                             | Existing shared parcel-update allow-list includes `CanCompleteOfficePickup`; Delivered by Office sends `receiverOtpVerificationToken` and `receiverOtpTarget: 'main'` when required. Home-delivery request sends only its status. |

Office-pickup permission alone shows the screen but does not grant these helper permissions.
Missing required read grants leave details unavailable; missing customer mutation grants fail
the selected card/contact action. The shared PATCH currently uses a broad workflow permission
allow-list rather than separate per-transition permissions; this feature does not strengthen
that pre-existing server boundary. Do not treat client filters or UI gates as server authority.

## Failures, recovery and client differences

OTP request/verify failures display the API error and do not mark verification successful.
The server checks branch OTP policy, verified token, principal/storage settlement and open
reconciliation cases again before office delivery. Provider failure returns 503 and expires the
new code; invalid codes, expiry and excessive attempts require correction or another code.
See [Parcel operations](PARCEL_OPERATIONS.md#receiver-otp) for shared delivery rules.

Card creation, contact resolution and the final PATCH are separate requests. A later failure
can leave earlier customer/card writes saved while the parcel remains uncompleted; this is
not an atomic payment flow. The error leaves the panel available. Before retrying after an
ambiguous network failure, reopen/refresh to inspect current parcel and saved-card state.
There is no automatic rollback or idempotency key in this mobile submit routine.

Web and Electron retain their existing table/dialog flow; mobile uses a scan/search screen
and handover panel. No mobile receipt printing, payment capture or WhatsApp administration
is added. WhatsApp availability is optional for SMS pickup, and the server remains the
authority for the WhatsApp module/configuration gate.

## Validation

Automated logic coverage lives beside the feature: list/queue scope, OTP input/countdown/
channel fallback, card/contact validation, confirmation gates, payloads, retained second
receivers, request ordering and failure propagation. Permission and native route mapping
are covered in the existing access-control/navigation suites. These are logic tests, not
rendered-hook, device, provider-delivery or end-to-end server tests.

Run `bun test ./apps/mobile/src/features/operations/office-pickup
./apps/mobile/src/features/access-control/utils/mobile-permission-rules.test.ts
./apps/mobile/src/navigation/navigation-service.test.ts` as one shell command from the root,
then `bun run --cwd apps/mobile typecheck`. Device scenarios are in the
[mobile smoke checklist](MOBILE_QA_SMOKE_CHECKLIST.md#waiting-for-pickup).
