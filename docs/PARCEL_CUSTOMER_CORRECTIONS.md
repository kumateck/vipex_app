# Parcel Customer Corrections

The web/desktop page `/parcels/customer-corrections` is under Operations → Pickup & Collection →
Parcel Customer Corrections. Enter an exact booking code, select a parcel if several share that
code, then choose Sender, Main receiver or an existing Second receiver.

## Access and scope

| Permission                         | Capability                                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `CanCorrectParcelCustomers`        | Find company parcels/customers and link a selected existing customer to a parcel role.                                  |
| `CanOverrideParcelCustomerDetails` | Find company parcels/customers and correct a linked customer's name/telephones and the selected parcel's recorded name. |

Either grant opens the page. Each save requires its mode's permission. Administrators assign
these through the existing role editor. Catalog additions do not grant permissions to existing
roles. Ordinary customer/parcel edit permissions keep their existing behavior. The server uses
the authenticated company and permits all its branches/locations, including closed call outcomes
and parcels dispatched for delivery. There is no additional module gate or native mobile page.
Updated OTP checks apply to web, desktop and mobile pickup workflows.

## Correct name and telephone

The editor starts with the customer profile name and both phones. Editing the name selects
**Save this name on the parcel and customer profile**. Staff can also select that option to copy
an already-correct profile name onto the parcel. Leaving it clear preserves both names during a
phone-only correction. A selected name correction updates this role's recorded parcel name and
the profile. Other recorded parcel names retain their values, including other roles linked to
the same customer. Future bookings use the updated profile name.

Telephone fields belong to the customer. Their changes affect every linked parcel's contact
display, including historical parcels. A number owned by another active company customer in
either phone slot returns a conflict. Use **Link existing customer** to correct that parcel's
association. Names trim to 1–255 characters. Primary phones are required, filled phones contain
ten digits, and the primary/secondary numbers must differ.

## Link existing customer

Enter a ten-digit telephone, select an exact primary/secondary match explicitly, then save a
reason. The page displays the selected customer's primary phone as the default main-receiver
pickup OTP destination. It retains that profile's phone slots. If lookup finds no customer,
correct the current profile or use an existing authorized customer-creation workflow.

Relinking changes the selected parcel association and recorded role name. Linking a main
receiver clears the former second receiver, both receiver ID-card selections, pending handover
signature and pickup credentials. Linking a second receiver clears its ID-card selection and
pending handover/OTP credentials. Main and second receivers must differ. Customer credit history
for the parcel requires Accounts reconciliation before relinking. Credit ledger entries never
move through this operation. Customer profiles, other parcel associations and posted payments
retain their existing ownership.

## Cutoff, OTP and failures

Corrections work on active parcels before handover confirmation. Supported states are Created,
Processed, In Transit, Arrived, Customer Contacted, Awaiting Pickup, Home Delivery Requested,
Address Collected, Dispatched, Returned to Office, Discrepancy, Aged in Warehouse and Return to
Source. Delivered by Office, Rider Given Parcel to Customer, Delivered at Home, Returned to
Sender, Cancelled, final disposal states and unknown states are blocked. A parcel confirmation
timestamp, delivery-confirmation snapshot or active delivery row with confirmed/delivered/
rider-completed timestamps also blocks saving, including inconsistent parcel statuses.

Every save requires a trimmed reason of 5–1000 characters. The server locks the parcel and
relevant customer records and checks opaque preview versions. Stale parcels/profiles, changed
lookup matches, inactive customers, duplicate phones, failed snapshot capture and failed audit
writes roll back the transaction. Customer, parcel, credential and audit changes commit together.
A completed save's old preview cannot be reused. Reload the booking after a conflict.

Profile corrections expire codes and unused tokens for every parcel using that customer as a
main/second receiver and clear pending signatures. Receiver corrections also clear the selected
parcel's pickup credentials. Fresh OTP requests resolve the current receiver's primary/selected
secondary phone. Code verification and token lookup additionally require the issued phone to
belong to the current receiver, covering a resend racing with correction. Staff request a new
code through the existing pickup screen. Saving a correction sends no OTP or notification.

History records `PARCEL_CUSTOMER_CORRECTED` with actor, role, mode, reason, old/new customer
details and previous parcel name. Profile changes also record `CUSTOMER_UPDATED`. Reprint
labels/receipts after a name correction.

## API

- `GET /v1/shipments/parcels/customer-corrections/lookup?bookingCode=...` returns parcel previews
  with tracking codes, status, restriction, opaque versions and role contacts. It returns up to
  50 exact matches, with a conflict for larger bookings requiring support review.
- `GET /v1/shipments/parcels/customer-corrections/customers?telephone=...` returns up to 20
  matching company customer IDs, names, phone slots and opaque versions.
- `POST /v1/shipments/parcels/customer-corrections/:id` accepts `expectedVersion`,
  `expectedCustomerVersion`, `party` (`sender`, `receiver`, `secondReceiver`), `mode`
  (`profile`, `relink`), `fullname`, `updateName`, `telephone`, nullable `telephone2`, and `reason`.
  Relinking requires `customerId` and `replacementVersion` and captures the selected profile's
  current name. Profile mode uses `updateName` to select name correction. Success returns the
  refreshed parcel preview.

Authentication/permission failures return 401/403, invalid fields 400/422, absent/out-of-company
parcels 404, and stale, duplicate, delivered or credit-linked corrections 409. Foreign customer
profiles cannot be exposed by lookup or selected for saving.

## Deployment and validation

Apply migration `0095_parcel_customer_corrections` before deploying server/web bundles. It
extends the existing trigger to allow explicit sender and second-receiver name corrections,
retaining receiver correction from `0081`. It adds no columns or historical backfill. This
document describes repository implementation. Deployment and role assignment follow the normal
release process.

QA scenarios cover the following.

1. Assign each grant independently and verify navigation, direct page access and the matching
   mode. Reject unauthenticated, ordinary-update-only and wrong-mode calls.
2. Look up single and multi-parcel bookings, select each parcel, and test missing/foreign codes.
3. Relink a called Awaiting Pickup parcel from another branch using a primary/secondary match.
   Check customer association, recorded name, primary OTP destination, financial values and audit.
4. Correct all three party names. Check profile and selected role only. Rename a profile then
   perform a phone-only correction and preserve both names. Reject duplicate phones in either slot.
5. Verify an OTP, correct its contact and reject its old code/token. Request a new code at the
   corrected number. Repeat for shared profiles and a racing resend. Capture a fresh signature.
6. Reject final statuses, confirmed handovers, inconsistent completed deliveries, stale previews,
   changed/inactive/foreign/same customers and credit-linked relinking. Race two saves from one
   preview and confirm only one commits.
7. Force audit failure or use the old trigger and verify complete rollback of profile, parcel
   and OTP changes. Review history and reprint corrected labels.

Automated coverage is in `tests/server/parcel-customer-correction*.spec.ts`. Persistence tests
require `PARCEL_CUSTOMER_CORRECTION_TEST=1` and an empty local database named
`vipex_customer_corrections_test` through `TEST_DATABASE_URL`. The fixture rejects other hosts
and database names.
