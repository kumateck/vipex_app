# Interrupted Receiver Cashier handovers — 23 November 2026

## Current implementation and recovery status

- Receiver Cashier search/resumption, the per-booking no-cash recovery operation and Super Search's
  undelivered-first ordering are implemented and tested locally. They have not been deployed by
  this investigation.
- The counts and candidate list below are the live database snapshot taken during the inspection,
  not a fresh query on every report edit. Sender-payment clarification does not change those totals:
  the reported collection amounts include only active **recipient** payments with receiver cashier
  type (`payer = 1`, `cashier_type = 1`). A parcel may also have a sender payment; that sender amount
  is excluded from these incident totals and must be retained.
- No live payment has been voided, reassigned or replaced by this investigation. The 27 legacy
  cases passed the technical recovery preview, but the exact bookings where no cash was physically
  received still need confirmation before any live financial correction.

## Payment handling rules

| Actual payment position                                         | Required action                                                                              | Payment treatment                                                                                                                                                               |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sender fully paid; no other charges outstanding                 | Another authorized operator confirms delivery through Waiting for Pickup                     | Preserve the sender payment, cashier, amount, date, receipt and tax records exactly; create no receiver payment                                                                 |
| Sender partially paid                                           | Preserve that payment and collect only the outstanding receiver amount at final confirmation | Attribute only the new receiver collection to the completing cashier                                                                                                            |
| Receiver cash was already physically received                   | Continue the pending handover and confirm delivery                                           | Retain the original legitimate receiver payment and its cashier; do not collect or record it again                                                                              |
| Receiver payment was posted but no cash was physically received | Run the reviewed no-cash recovery for that booking, then continue handover                   | Void only the erroneous receiver posting and eligible unfiled tax, restore the unpaid balance and record the eventual collection against the cashier who completes confirmation |

The no-cash recovery is not a transfer of an existing legitimate payment between cashiers. It
corrects a posting for money that was never received. Sender payments are excluded even when a
pending handover incorrectly references one; that recovery request is blocked. Outstanding
storage or other charges still follow their normal validation and collection rules.

## Live evidence

Read-only inspection of `vipex_live_db` at 04:56 UTC on 23 November 2026 found:

| Category                                        | Parcels |     Posted receiver collections | Evidence                                                                       |
| ----------------------------------------------- | ------: | ------------------------------: | ------------------------------------------------------------------------------ |
| Kumasi legacy pending handovers                 |      27 | GHS 1,231.00 across 28 payments | 11 signed, 16 unsigned; no delivery confirmation; requests from 14–20 November |
| Kumasi deferred pending handovers               |       3 |                        GHS 0.00 | Requests from 21–22 November retain their balances and private payment plans   |
| Paid Awaiting Pickup without a pending handover |      10 |   GHS 467.00 across 11 payments | Nine have delivery-reversal history; one has a subsequent receiver correction  |

These are database states at inspection, not proof of whether a customer physically paid or collected.
The last category is separate from the pending-signature incident; its payment records must not
be automatically voided or attributed to another cashier.

Representative cases:

| Booking    | Branch | Posted collection | Current evidence                                                    |
| ---------- | ------ | ----------------: | ------------------------------------------------------------------- |
| AN7139582Q | Kumasi |         GHS 35.00 | Prepared 20 November; unsigned legacy request; undelivered          |
| AN4416461Q | Kumasi |         GHS 35.00 | Signed legacy request; delivery not confirmed                       |
| AS1714719K | Kumasi |        GHS 116.00 | Principal GHS 30 plus storage GHS 86; signed legacy request         |
| AN2524984O | Kumasi |          GHS 0.00 | Prepared 22 November; deferred GHS 30 balance; unsigned             |
| AN4195883U | Kumasi |         GHS 30.00 | Receiver corrected after payment on 19 November; no pending request |
| SA8116133B | Accra  |         GHS 67.00 | Delivery-reversal history; no pending request                       |

`scripts/inspect-interrupted-receiver-handovers.ts` reproduces the bounded inspection. It enforces
read-only database transactions and returns at most 100 pending rows and 100 payment examples.
Its pending summary describes that bounded sample; grouped paid-undelivered totals cover all
matching Awaiting Pickup parcels. Run with `bun scripts/inspect-interrupted-receiver-handovers.ts`;
the database URL comes from `CHECK_DATABASE_URL` or the configured `DATABASE_URL`. Output omits
customer phones, OTP credentials, private plans and signature images. No live records were changed.

## Cause and implementation

Older servers posted receiver payment while preparing a signature request. That reduced the
balance before delivery confirmation. Ordinary Receiver Cashier and Waiting for Pickup queries
exclude pending handovers deliberately, preventing a second collection. Pending requests instead
used a separate Receiver signatures search, which did not follow the main search and did not match
receiver phone numbers. Staff could consequently find a booking in Super Search but miss it in
their normal cashier search.

Commit `b6184f64` on 20 November introduced deferred payment plans. The three newer live requests
show that behavior in production: request preparation has not recorded money. The present fix
connects the main web/Desktop search to pending handovers and expands the shared pending search
to names and phones. Another cashier can find and open existing requests without collecting twice.

Existing confirmation already accepts a different cashier and an earlier-day open ticket. New
payments belong to the confirming cashier's active session and commit atomically with delivery.
Ordinary confirmation retains legacy requests' original payments and does not charge again.
Verified no-cash cases use the separate recovery operation before confirmation. An OTP
failure before preparation leaves payment and delivery unchanged. See
[Receiver Cashier signatures](../RECEIVER_CASHIER_SIGNATURES.md) for current behavior and QA.

The locally implemented no-cash recovery operation provides a separate System Admin action for a verified unpaid
legacy request. It voids that request's premature postings and eligible unfiled tax, restores the
balance and retains its signature in a deferred plan. The cashier who eventually confirms receipt
gets the new collection. The live recovery preview found all 27 legacy cases technically eligible:
27 unfiled tax entries, no matching journals, daily cash confirmations or bank settlements. This
does not determine whether cash was physically received; each selected booking needs that fact
verified before execution.

Super Search now requests undelivered-first ordering in the local web/Desktop and mobile clients.
The server applies the priority before pagination and retains the existing order within each
group. Office delivery, rider handover and home delivery statuses (6, 10 and 11) form the delivered
group, matching the existing delivered-date display. This search change does not alter a parcel's
payments or delivery status. See [Parcel operations](../PARCEL_OPERATIONS.md) for behavior and QA.

### Recovery candidate review

This investigation did not change the rows below. Amounts are the original recipient postings
observed at inspection; physical cash receipt has not been established for every booking.

| Booking    | Cashier originally charged | Amount (GHS) | Signed |
| ---------- | -------------------------- | -----------: | ------ |
| AN7139582Q | HECTORIA OPPONG            |        35.00 | No     |
| AN4416461Q | AFIA NYARKO ASABERE        |        35.00 | Yes    |
| AN9968169C | HECTORIA OPPONG            |        40.00 | Yes    |
| AN1139794L | CUTECY YAMOAH ARTHUR       |        40.00 | Yes    |
| AN8896445C | CUTECY YAMOAH ARTHUR       |        30.00 | Yes    |
| AN1593365U | IRENE AGYEIWAA             |        50.00 | Yes    |
| AN6922468E | IRENE AGYEIWAA             |        40.00 | Yes    |
| AN8945928K | MAVIS OWUSU                |       100.00 | No     |
| AS1714719K | MAVIS OWUSU                |       116.00 | Yes    |
| AN7464116G | ABIGAIL FRIMPONG           |        60.00 | No     |
| AN8529727Y | MAVIS OWUSU                |        30.00 | No     |
| AN1284566T | MAVIS OWUSU                |        40.00 | No     |
| AN6659315R | MAVIS OWUSU                |        35.00 | No     |
| AN8894431W | MAVIS OWUSU                |        30.00 | No     |
| AN9833562G | ABIGAIL FRIMPONG           |        40.00 | No     |
| AN9856961U | ABIGAIL FRIMPONG           |        35.00 | No     |
| AN6722587P | ABIGAIL FRIMPONG           |        35.00 | Yes    |
| AN1885957D | CUTECY YAMOAH ARTHUR       |        40.00 | Yes    |
| AN8682836O | CUTECY YAMOAH ARTHUR       |        35.00 | Yes    |
| AN2278342C | CUTECY YAMOAH ARTHUR       |        50.00 | Yes    |
| AN3228975J | IRENE AGYEIWAA             |        80.00 | No     |
| AN8292532P | IRENE AGYEIWAA             |        35.00 | No     |
| AN5932189Z | HECTORIA OPPONG            |        40.00 | No     |
| AN7848365U | AFIA NYARKO ASABERE        |        40.00 | No     |
| AN1479889R | IRENE AGYEIWAA             |        50.00 | No     |
| AN9267543H | CUTECY YAMOAH ARTHUR       |        30.00 | No     |
| AN5549322M | HECTORIA OPPONG            |        40.00 | No     |

## Rollout and remaining operations

The search and recovery fixes require deployment of the updated server and web/Desktop client.
Mobile Super Search must also be updated for its new ordering option. No schema migration is
required. The shared pending-search improvement also applies to mobile Receiver Signatures.
The local changes described here have not been deployed by this investigation.

At inspection, the 28 legacy recipient payment rows were posted against their original cashiers.
This investigation has not changed those financial records. Recovery
requires the reviewed per-booking operation after verifying whether money actually changed
hands. Do not bulk void, backdate or reassign payments on the assumption that all are unpaid.
Review the ten non-pending cases through their
reversal/correction histories separately. A settled parcel without a pending request belongs in
Waiting for Pickup unless new storage is due.

Changed storage accrual or an ended original ticket can still block an old request at confirmation.
The fix exposes those requests; it does not bypass current balance, collector, reconciliation,
signature or ticket guards. Verify these cases operationally before confirming physical delivery.

Automated scenarios are in `tests/server/receiver-handover-resumption.spec.ts`,
`tests/server/receiver-handover-payment-confirmation.spec.ts` and
`tests/server/receiver-cashier-signatures.service.spec.ts`, plus
`tests/server/unpaid-receiver-handover-recovery.spec.ts`,
`tests/server/sender-paid-handover-preservation.spec.ts` and
`tests/server/super-search-undelivered-first.spec.ts`. Device printing and shared-field
search/pagination checks remain in the module QA checklist.

## Follow-up: AN2524984O, 27 November 2026

Read-only live inspection (`vipex_live_db`, 27 November) of the parcel reported as "OTP entered,
signature not received, not showing in Receiver Cashier":

| Time (UTC)       | Event                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| 22 Nov 14:00     | Main-receiver OTP verified (Mavis Owusu); deferred request prepared, GHS 30 unpaid             |
| 23 Nov 15:01     | Signature captured on mobile (Abigail Frimpong), handover target **second receiver**           |
| 24 Nov 11:24     | Confirmed on Desktop (Cutecy Yamoah Arthur); GHS 30 receiver payment; status Delivered         |
| 25 Nov 10:29     | Delivery reversed (Gyamfua Ophelia Boadi), reason "wrong printout"; payment voided             |
| 27 Nov (inspect) | Awaiting Pickup, GHS 30 due, no pending request, no open storage/reconciliation case or ticket |

The parcel is therefore not an interrupted signature request any more. The reversal removed the
earlier handover, so it never appears under **Receiver signatures** or on mobile Receiver
Signatures; it is under **Awaiting Pickup** and needs a fresh OTP, signature request, mobile
signature and Desktop confirmation. The live Receiver Cashier list query returned it for its
booking/tracking code, main receiver phone and names, but **not** for the second receiver's phone
(the person who collected). No server logs for 22 November are retained, so why the first
request took until the next day to be signed cannot be proved from data; the request did exist
on 22 November, and the 23 November search fix was released before it was signed.

Fixes (not yet deployed at time of writing): second receiver name/phone search in parcel lists
and pending handovers; a Receiver signatures notice linking to matching Awaiting Pickup parcels;
mobile search hint and empty-state guidance. No live data was changed. Ten other parcels reversed
since 15 November are also back in Awaiting Pickup and follow the same path. Behavior and QA:
[Receiver Cashier signatures](../RECEIVER_CASHIER_SIGNATURES.md#continue-after-a-delivery-reversal-or-a-lost-request).
