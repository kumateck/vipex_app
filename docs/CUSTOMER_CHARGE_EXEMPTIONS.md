# Customer Charge Exemptions

## Customer Management and booking

Customer types are Individual (`0`), Business (`1`), Family (`2`), Friends (`3`), Director (`4`),
and Staff (`5`). Create or classify the four exempt types in Customer Management using the existing
CRM create/update permissions. Ordinary inline booking customer creation remains Individual.
Only Business can be credit eligible. Customer list filtering applies before pagination.

A new parcel is fully exempt when **either its sender or its receiver** has an exempt type at
booking. This either-party rule is the implementation assumption communicated when work began;
the earlier discussion did not explicitly settle which party should qualify. Staff takes precedence
when either party is Staff; otherwise the receiver's exempt type takes precedence over the sender's.
The officer selects an existing customer; no manual exemption or approval step is added at booking.

An exempt parcel has zero transport charge, zero receiver balance and no sender payment, credit
charge, delivery fee, storage charge or other payment component. Its declared parcel value remains
independent and can be positive. The UI shows **Exempt**, not a payment made or a missing price.
New exempt parcels entered as Created advance to Processed without a payment step. A booking
containing only exempt parcels does not require a cashier session; mixed bookings keep the existing
cashier rules for their ordinary parcels. Tracking, routing, custody, receiving, calls, identity/OTP
requirements and delivery status rules continue to apply.

The server resolves customer types within the authenticated company. It rejects nonzero charges,
receiver balances or sender payments on exempt parcels, and rejects CREDIT settlement. It rechecks
and share-locks the customers during the booking transaction. A concurrent classification change
requires refreshing and retrying rather than creating a parcel with stale exemption eligibility.

## Related staff and office contact numbers

Only Staff parcels require **Receiving staff** (`relatedStaffId`). Family, Friends and Director do
not require it and reject a supplied related staff link. Select an active, nondeleted HR employee
at the destination branch in the same company. The employee does not need a system user account.
Unknown, inactive, deleted, wrong-branch and wrong-company selections reject the entire booking.
A failed staff lookup offers Retry; an empty list prevents completing a Staff booking.

The receiver customer can hold the receiving office/branch telephone. Keep that customer contact
and its existing telephone uniqueness rules; do not create a separate customer with the same office
number for each employee. The parcel separately retains the employee ID and name snapshot.
Related staff identifies the intended staff recipient; it is independent of the creator, charge
agent, arriving-parcel officer, shelf picker and actual handover officer.

Staff details are available in parcel search/details. Web/desktop and mobile stickers use the
server-verified name snapshot alongside the receiver name and retain the office telephone.
A5, thermal-roll and home-delivery receipts show exemption and omit the standard storage-fee terms for exempt parcels.
Subsequent employee renaming or customer reclassification does not rewrite recorded parcel history.

## Persistence and enforcement

Migration `0092_customer_charge_exemptions` adds nullable columns to `parcels`:

- `charge_exempt_customer_type smallint`
- `related_staff_id varchar(25)` referencing `employees(id)`
- `related_staff_name_snapshot varchar(255)`

The exemption and related staff snapshots are immutable after insert. No historical backfill is
performed: an old zero-price parcel remains unclassified and is not automatically exempt. Changing
an existing customer's type affects future bookings, not charges on existing parcels.

Database triggers derive the exemption from the linked customers on every parcel insert, including
older/direct creation paths; validate Staff recipients; prevent later exemption removal; reject
nonzero parcel balances/credit, all parcel payment writes, delivery fees/rider collections and
parcel-referenced credit ledger entries. Storage calculations and SQL collection/accrual filters
explicitly exclude exempt parcels. Physical ageing remains visible, with zero billable storage days
and rate. Legacy zero-price-to-CREDIT correction requests reject exempt parcels; the correction
button is hidden for these records.

## APIs, permissions and clients

- CRM create/update accept `customerType` values `0..5`; list filtering accepts `0..5`.
- Booking telephone lookup includes `customerType`, without exposing the customer's credit settings.
- `POST /v1/shipments/bookings/create-with-parcels` accepts nullable `relatedStaffId` per parcel.
- `GET /v1/shipments/bookings/receiving-staff-options?destinationId=...` requires
  `CanCreateBookingWithParcels` and returns `{ id, fullname, employeeNumber }` for eligible staff.
- Self-service completion accepts `relatedStaffId`. Agent draft reads/claims/edits include
  `senderCustomerType` and `receiverCustomerType`. The agent staff-options equivalent is
  `GET /v1/self-service/receiving-staff-options`, requiring `CanCompleteSelfServiceBookings`.
- Parcel creation responses, parcel details/list responses and verified sticker data expose the
  recorded exemption/staff fields as appropriate. Sticker status now also supports `EXEMPT` with
  amount `0`; ordinary zero-charge records still fail sticker payment verification.

Web/desktop Customer Management can create/edit these types. Updated web/desktop and mobile
booking and agent self-service completion support exemption and Staff selection. Mobile Customer
Directory displays the new types but retains its existing restrictions on classification edits.
Public self-service does not let customers assign themselves an exempt classification; the officer
completing the draft applies the server-resolved customer types.

Existing installed clients can continue creating ordinary parcels. Their old positive-price
validation cannot complete exempt bookings; they must be updated for these customer types. Old
sticker renderers that do not recognise `EXEMPT` must also be updated before printing these parcels.

## Rollout and validation

Apply the vetted additive migration before deploying the backend, then deploy updated web/desktop
and mobile clients. The migration uses bounded local lock/statement timeouts and can be rerun.
It does not alter historical customer classifications, charges, payments or ledger entries.
Implementation and test migration runs do not constitute production deployment.

Automated coverage:

- `tests/utils/customer-charge-exemption.spec.tsx`: classifications, either-party precedence,
  zero-price validation, storage/physical ageing, explicit payment labels and sticker verification.
- `tests/utils/customer-charge-exemption-render.spec.tsx`: conditional Staff selection and verified receipt/sticker rendering.
- `tests/server/customer-charge-exemption.routes.spec.ts`: staff lookup authentication.
- `tests/server/customer-charge-exemption.spec.ts`: booking persistence and atomic failures,
  staff scope, historical snapshots, storage filters, charge/payment/credit guards, CRM creation,
  self-service completion and migration reruns.

The database suite requires `CHARGE_EXEMPTION_TEST=1` and an empty dedicated local
`vipex_charge_exemption_test` database in `TEST_DATABASE_URL`. It creates schema fixtures and
removes its test schema afterward. Never point it at a shared or production database.

Manual QA scenarios:

1. Create each exempt type in Customer Management, filter its tab, edit it and reopen the profile.
2. Book with each type as sender and as receiver on web/desktop and mobile. Confirm zero charges,
   no collection dialog/payment record, normal tracking, and an Exempt sticker.
3. Select a Staff customer using the office telephone. Pick the employee, verify their name in
   details/stickers and the unchanged office telephone. Change destination and reselect staff.
4. Reject missing/ineligible staff and verify no partial booking. Confirm the other exempt types
   need no staff selection. Retry failed lookups and test an empty staff list.
5. Move an exempt parcel through receiving, warehouse ageing, office collection and zero-fee home
   delivery. Confirm no storage or other amount becomes collectible and identity checks still apply.
6. Attempt charge edits, storage collection, miscellaneous payments, fee increases and legacy
   CREDIT correction. All must fail; no financial records should be written.
7. Reclassify the customer and rename the employee after booking. Recorded exemptions and staff
   names must remain intact. Ordinary/credit bookings and historical unclassified zeros must retain
   their existing behavior.
