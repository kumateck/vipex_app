# Mobile QA Smoke Checklist

Last updated: 2026-10-19

## Self-service completion and stickers

- Open a claimed draft with contents filled. Parcel details must be blank and completion blocked
  until the officer enters operational details. Edit the customer contents without overwriting
  those details; open another draft and confirm the officer's form resets.
- Complete sender/receiver/split bookings. The completed panel must retain the saved booking and
  tracking codes and allow manual sticker printing with 1, 2 or 25 copies; reject blank, zero,
  fractional, negative and unsafe quantities. Verify destination, contacts, CS and officer details.
- Sender-only labels show PENDING rather than PAID. Receiver/split show the planned receiver due.
  Printing creates no payment and does not bypass the usual cashier processing.
- Cancel/fail native printing and retry without a second completion request. Fail usage logging
  and use Retry Print Log without another label. Fail destination loading and retry it in place.
  Verify physical 90 × 92 mm output with the branch's Android/iOS print service and printer.

## Incoming receiver corrections

- In incoming receive-process, rename the receiver and save. The selected parcel and linked
  customer must show the corrected name after reload; another parcel for that customer retains
  its recorded name. Customer Management renames must preserve both parcel names.
- Change only the telephone after a Customer Management rename; neither the customer's newer
  name nor either recorded parcel name changes.
- Missing customer-update permission, invalid/duplicate phone, a changed receiver association,
  or a failed parcel write must leave the customer and parcel edit unsaved. Apply migration
  `0081` and deploy the new backend before testing the updated mobile build. See
  [Parcel Operations](PARCEL_OPERATIONS.md#correcting-a-receiver-from-a-parcel).

## Scope

- `apps/mobile` UX and permission guard behavior.
- Theme behavior (light/dark/system).
- Queue, Rider, Receive, Incoming Process, and frontline operations workflows.

## Pre-check

Before mobile sign-in, register the installation and obtain head-office approval. Confirm a
pending or revoked installation cannot use existing sessions. Full transition, cross-company,
and reinstall checks are in [Native Device Registration](DEVICE_REGISTRATION.md).

1. Login with a user that has all mobile-related permissions.
2. Login with a restricted user for each role path:
   - Queue-only user
   - Rider-only user
   - Receive-only user
   - Self-service read-only and completing users
   - Call-center call-only and address-collection users
   - Customer read-only and update users
3. Confirm API base is set to `https://testing.app.vipexparcel.com`.

## Appearance checks

1. Toggle appearance mode on home: `system`, `light`, `dark`.
2. Force OS dark mode and verify `system` tracks OS.
3. Confirm text contrast in:
   - Login password field
   - KPI cards
   - Empty state messages
   - Buttons and chip labels

## Permission checks

1. Queue screen:
   - No queue permission -> no-access page.
   - View-only queue permission -> can view boards/search but cannot issue ticket.
2. Rider screen:
   - No rider permission -> no-access page.
   - View rider + no complete delivery permission -> can view parcel details but action buttons disabled.
3. Receive screen:
   - No receive permission -> no-access page.
   - View-only receive + no update permission -> can scan/view but cannot mark arrival.
4. Receive process screen:
   - No receive permission -> no-access page.
   - No update permission -> edit and confirm-arrived disabled.
5. Frontline workflows:
   - Tap each of the five Operations cards and confirm its titled screen opens instead of Dashboard.
   - Self-service read permission does not enable claim or completion.
   - Call-status permission shows only the current user's branch-scoped assigned calls and does not enable address collection.
   - Address-collection permission does not record a call through the call-status endpoint.
   - Customer read permission does not enable contact editing.
   - Delivery review requires `CanMarkDoorstepCalled` and branch scope.
6. Dashboard identity:
   - IT Officer with rider read permissions remains on the standard Dashboard.
   - Only `userType = RIDER` receives Rider Dashboard and Rider tab presentation.
   - Missing or invalid `userType` falls back to the standard Dashboard.

## Interaction checks

1. Pull-to-refresh works on:
   - Queue
   - Rider
   - Receive
2. Per-action loading labels show correctly:
   - Queue ticket issue
   - Rider given/returned
   - Receive scan process
   - Receive process save/confirm
3. Haptics:
   - Success for successful actions
   - Warning for blocked/validation cases
   - Error for failures

## Status and skeleton checks

1. Status chips render and match status context:
   - In-transit/awaiting states as warning style
   - Arrived/delivered/paid as success style
2. Skeleton cards appear while loading lists on:
   - Queue boards and search results
   - Rider lists
   - Receive incoming list

## Functional smoke checks

1. Queue:
   - Search parcel
   - Open details
   - Issue ticket
   - Copy and share ticket
2. Rider:
   - Search parcel
   - Open details
   - Cashier with `CanManageParcelSecondReceiver`: on web Delivery Cashier, search an Address
     Collected/Dispatched booking; add, replace and remove a second receiver. Verify same-company
     phone reuse, ten-digit/name validation, main receiver rejection and destination-branch scope.
   - Refresh mobile Assigned Deliveries and confirm saved second name/phone appears. Select main
     or second; confirm switching clears the signature, and only the selected recipient signs.
     A rider with no customer-create/manage permission can select but cannot enter a new contact.
   - With no second receiver, verify that choice is disabled and directs the rider to the cashier.
   - Replace/remove the contact after the rider opens confirmation: stale second selection must
     fail without changing status, collections or signature; refresh and try again. Verify a
     completed handover cannot be edited by the cashier and receiver selection appears in audit.
   - Mark given
   - Mark returned
3. Receive:
   - Install Android build `1.0.18` or later from a clean APK install and confirm a black-on-white
     parcel QR is detected while offline, proving the native ML Kit model is bundled.
   - Permanently deny camera permission, confirm **Open Camera Settings** appears, grant access in
     system settings, return to the app, and confirm the camera activates.
   - Open the screen and confirm the incoming count loads automatically and matches the server total for the user's branch.
   - Confirm the camera shows a clearly visible moving scan band with a solid center line and "Scanner active" status before detection.
   - After detection, confirm haptic feedback occurs and the camera is covered by the large **QR detected — Finding incoming parcel…** progress overlay until lookup completes.
   - Scan a current tracking-URL QR and a legacy production `QR-<tracking-code>` sticker.
   - Print a new portrait thermal sticker and verify its 22 mm compact `QR-<tracking-code>` payload
     scans from the physical label, not only from the on-screen preview. Repeat through browser and
     desktop printing at 100% scale with printer enhancement/smoothing disabled. Confirm no booking
     or tracking code is printed beneath the QR.
   - Confirm the scanner starts on the neutral back lens, pinch-to-zoom works, and the Light toggle
     appears only when the device has a torch.
   - Scan a compliant black-on-white print under normal and dim light. Verify blue/dark stock is
     handled with a white 30 mm overlay label or manual search, not accepted as production stock.
   - Cover the QR or introduce glare, then use the scanner card's **Camera not reading?** booking/tracking-code fallback with the code printed beneath the QR. Confirm it opens the same branch-scoped parcel review flow.
   - Repeat scan → parcel review → **Back To Incoming List** at least three times; every return must show a live camera preview without refresh, a dark preview, or `session/invalid-output-configuration`.
   - Force or simulate a camera-session error and confirm the native error message and in-screen **Restart Camera** recovery appear instead of a console error or unexplained dark preview.
   - In both scan-to-receive and consignment receiving, scan while lookup is pending and confirm the
     camera pauses, then resumes and accepts the next scan.
   - Confirm an unreadable, wrong-branch, or non-in-transit QR does not open an unrelated parcel.
   - Search incoming
   - Open receive-process screen
4. Receive process:
   - Edit fields
   - Save edits
   - Confirm arrived
   - After confirming an arrived parcel from both scan and manual search, return to the receive screen with a cleared flow ready for the next parcel.
   - Tap **Back To Incoming List** after opening a parcel from scanning, manual search, and a direct route; each case must open the native parcel scanner screen, never the desktop incoming page.
5. Self-service:
   - With `CanReadSelfServiceBookings`, confirm Self-Service Bookings appears in both the drawer and
     Operations Hub; without it, confirm both entry points are hidden and direct access is denied.
   - List drafts and confirm each card shows sender, receiver, declared value, submission time,
     expiry, and claim status.
   - With completion permission, open an available draft and confirm it is claimed before the
     completion form appears; with read-only permission, confirm opening does not claim it.
   - Search by sender name, receiver name and a phone typed with spaces; confirm no-match text.
   - With completion permission, tap **Edit booking details**, change contacts, destination
     branch/location, contents and value, save, and confirm the summary and completed parcel use
     the corrections while charge and CS choices are kept. Confirm invalid phones or value block
     save, and that changing a saved customer without `CanUpdateCustomers` shows the server error.
   - Complete sender/receiver/split pay-now drafts.
   - Confirm concurrent claim and expired draft errors do not create bookings.
6. Call center:
   - Confirm Assigned calls contains only the signed-in user's Arrived, Contacted, and Returned to Office assignments for the current branch.
   - Search by booking, tracking, receiver, and telephone; confirm an unassigned parcel cannot be found.
   - Open the device telephone app from an assigned parcel; verify a missing telephone disables the action.
   - Save Customer will get back and confirm the parcel is Awaiting Pickup and searchable in the pickup and shelf picker queues; the call is recorded separately.
   - Save Customer will come and confirm the parcel moves to Awaiting Pickup and leaves the assigned queue.
   - Enable a second receiver, reject missing/short values, and save a valid ten-digit telephone when customer-create permission is present.
   - Save Customer wants delivery and confirm it enters Delivery addresses when that queue is permitted.
   - Test SMS/email combinations, no notification, successful notification, and notification failure after a successful outcome save.
   - Switch to Delivery addresses, record a permitted call, validate address and fee, and save collection.
7. Receiving discrepancies:
   - Select expected parcel or enter unmatched identifiers.
   - Require notes and photo; test denied camera and failed photo upload after successful create.
8. Delivery-change review:
   - Approve, reject, handle already-reviewed conflict, and reject another branch.
9. Customers:
   - Search, inspect read-only, update limited contact fields, and handle duplicate-phone conflict.
10. Super Search parcel details (see [Parcel details and history](PARCEL_DETAILS.md#clients)):
    - Open a home-delivered parcel; switch Overview, People, Payments, Delivery, History.
    - Overview: status, rider line and Created By under it; a deleted parcel shows who deleted it
      and why.
    - People: sender/receiver phones, route, call-center agent, Handled By names.
    - Payments: charges and paid/outstanding totals; each payment shows Received By, voids show
      who voided and why.
    - Delivery: rider, assigned/handed-over/returned times, front desk, confirmations.
    - History: timeline newest first, grouped by day, each entry with user and branch; pull to
      refresh reloads it. With the history endpoint unavailable, the other tabs still load and
      History shows the error.

## Regression checks

1. `bun run --cwd apps/mobile typecheck` passes.
2. Rebuild and install the Android app after native scanner configuration changes; confirm the release APK detects QR codes without a prior model download.
3. Publish a newer Android build while production MinIO uses its internal HTTP endpoint; confirm **Update now** receives an `https://` app URL, downloads the APK, verifies its SHA-256, and opens the installer without the “update URL must use HTTPS” error.
4. Confirm a missing, altered, or expired mobile-update download signature returns 401 and does not stream the APK.
5. Login, forgot, reset, and set password screens still render correctly.
6. Home quick-access links only show modules user has permission for.
7. With the company device-verification module off, sign in and restore a saved native session
   without a device credential. With it on, confirm a pending or revoked device cannot sign in or
   restore a session, and an approved device can. See
   [Native Device Registration](DEVICE_REGISTRATION.md).
8. Typecheck alone does not prove imports resolve at runtime. Run a Metro bundle
   (`npx react-native bundle --platform android --entry-file index.js --bundle-output <tmp>`) and
   confirm no "Unable to resolve module" error. Then scan a parcel on Receive, open the incoming
   receive process, edit the parcel details, and save. It must save without a "cannot find
   module" error. The fix is that Metro now resolves `@/shared/*` from the root `src/`.

## Location Services, Charge Agent and Receiving Quotas

- Apply migration `0082` to the test database; verify old locations default to both services.
- Disable receiving on a sending-only location and confirm it disappears from mobile pickup
  options, web parcel creation, public self-service and staff completion destination lists.
- Attempt booking from a receiving-only assigned source; expect a clear error and no new parcel.
- Enter a charge and select the required charging agent; retry failed agent lookup, reset the
  form, and confirm missing/foreign/inactive agents cannot submit a valid attributed booking.
- Scan, search and receive above the request quota, including consignment receive/close;
  verify authentication, scope, permissions and duplicate scan prevention still work.
- Verify invalid-token traffic and unrelated parcel updates remain rate limited.
- On web/desktop Self-Service Bookings, search names/phones/content/status, scroll and paginate;
  view without completion rights, correct customer details, contents and declared value, test
  saved-profile permissions and stale edits, and verify pricing survives edits and completion uses
  the corrected contacts, contents and value.

Public self-service in a phone browser: submit a booking, use **New booking** to open a blank
form, and repeat up to 10 total successful bookings for one scan. Verify completed count,
receiver/content isolation, the shared 15-minute server deadline and no New booking button after 10. Refresh after the limit and require a rescan; rescan and start a fresh batch. This applies to
the public QR website; the staff mobile completion/print workflow is unchanged.

Self-service duplicate prevention: double-tap Submit, retry after a lost response, and send two
concurrent requests with the same token/details. Verify one draft ID, one count increment and the
same success response. Retry changed contents under the used token and require 409. Retry a
failed database save and verify the original token still works. Refresh the success page and
confirm it does not re-POST the previous form.

Delivery cashier shift sales: receive GHS 30 principal and GHS 60 delivery fee, open Sales Report
from the shift, and confirm **To Be Paid received = GHS 30** and **Delivery fees received = GHS 60**.
Keep **Payments = GHS 90**. Verify partial payments, multiple methods/parcels, zero collections,
voided-payment exclusion after refresh, and that unrelated cashier payments and **Outstanding
To Be Paid** are not included in either delivery subtotal. Compare with web and its printout.

Parcel creation customer-name popup: for both sender and receiver, search an existing primary or
secondary phone, select the correct match, tap the pencil and save a corrected name. Confirm ID
and numbers stay unchanged, both roles refresh if the same customer is selected, and the newly
processed parcel/sticker uses the saved name. Test failed updates, blank/overlong names, repeated
Save taps, Cancel and missing `CanUpdateCustomers`. Existing parcel name snapshots must remain
unchanged and no duplicate customer or premature booking should be created.
