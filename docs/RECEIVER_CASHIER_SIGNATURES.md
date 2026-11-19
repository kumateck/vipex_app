# Receiver Cashier signatures

In Branch Management, enable **Require Receiver Cashier signature** for the destination branch.
The setting defaults to off. It applies to Receiver Cashier collections, including parcels with
only storage fees due. **Require receiver OTP** remains a separate branch setting.

## Processing, signing, and confirmation

1. In **Receiver Cashier**, open the parcel, select the collector and parcel associate, verify
   OTP if required, and choose **Receive Payment + Request Signature**. The server records payment
   and prepares the handover together. The parcel stays Awaiting Pickup and leaves both ordinary
   Receiver Cashier and Waiting for Pickup lists. The cashier’s open dialog switches to waiting
   for the signature. A cashier can also reopen the handover from the Receiver signatures list.
2. In React Native, open **Operations → Receiver Signatures**. The open list refreshes when the
   request is recorded. Open the parcel, ask the customer to sign on the screen, and tap **Save
   signature**. On Windows Vipex Desktop, the cashier can instead use **Sign on Topaz** for the
   same parcel. A signature submission records the drawing and leaves the handover pending.
3. In Vipex Desktop, **Receiver Cashier → Receiver signatures** changes to **Ready to confirm**
   as soon as the signature is saved. The open dialog automatically loads the preview and enables
   **Confirm Received** when the preview is ready. Confirm when the customer has the parcel. The server marks it delivered and closes the
   pickup ticket, if any. The desktop app then prints the receipt by default. If Digital Receipts
   is enabled, the cashier chooses delivery options in this confirmation dialog.

The lists reconcile automatically, with a four second refresh fallback if the two clients reach
different API processes. Users need `CanCreateReceiverPayments` and an assigned destination branch.
Desktop confirmation requires an open cashier session. Web Receiver Cashier can initiate a
signature request and see its status. Desktop owns confirmation and physical printing.

A parcel stays resumable if the pad disconnects, the customer cancels signing, or either app
closes. Reopen it in Receiver Signatures without taking payment again. Only the first successful
capture is retained. Confirming twice does not deliver or print twice. If the receipt fails to
print after delivery, use Receiver Cashier → Delivered → Reprint Receipt. Turning the setting
off affects future payments. Existing pending parcels still require a signature and confirmation.

## Batch handover

**Receiver Cashier → Hand over multiple parcels** is available on web, Desktop and mobile.
Search by receiver telephone and select 2–20 parcels with a balance due. After one OTP is verified,
the main receiver signs once. Confirm to record the selected payment method and deliver the
whole selection in one transaction. It requires an active cashier session. The web and mobile
signing pads are available, and Desktop supports Topaz. Confirmed payments remain eligible for
per-parcel receipt reprint in **Receiver Cashier → Delivered**. Existing pending signatures use
the single-parcel flow above. See [Parcel operations](PARCEL_OPERATIONS.md#hand-over-multiple-parcels).

For a desktop-initiated batch, verify its OTP, then choose **Request signature on mobile**.
On Android or iOS, open **Operations → Receiver Signatures**. The **Multiple-parcel signatures**
section shows one request with every selected booking and tracking code. Review the list, choose
**Sign for N parcels**, and save one drawing. The desktop dialog checks for the signature every
four seconds and displays its preview. The initiating operator then confirms the payment and
handover for that exact selection. Payment and delivery occur together at confirmation.

The same remote signature flow supports desktop **Waiting for Pickup** batches. Mobile users
with `CanCompleteOfficePickup` see office-pickup requests, and those with
`CanCreateReceiverPayments` see cashier requests at their active destination branch. The
single-parcel cashier list continues to require the cashier permission. Signing retains the
mobile capture operator separately from the desktop operator who confirms the handover.

Requests last until the verified batch proof expires. Reopening the mobile screen restores the
saved request and any existing signature. Keep the initiating desktop batch dialog open for
confirmation. **Sign here instead** cancels the mobile request and returns to the local pad.
Each replacement request has a new ID, so a drawing from an older open mobile dialog is rejected.
The server retains the first successful capture and rechecks every member's receiver, status,
balance and queue before signing and before confirming. A changed member requires refreshing the
selection. A resend invalidates the previous proof after successful dispatch. Expired, completed
and cancelled requests leave the mobile queue. The batch list includes the parcel references
and note indicators. It excludes OTP codes, verification tokens and signature images.

Migration `0101_batch_mobile_signature` must precede the updated server and clients. It adds a
private JSON request/capture field and pending-request index to `parcel_receiver_otps`.
Request, capture and cancellation write batch audit events with the selected parcel IDs. The
image and OTP are excluded from those audit events.

## Windows Topaz setup

Use the Topaz SignatureGem T-LBK462-HSB-R connected by USB. Install the manufacturer's
[SigWeb service](https://www.topazsystems.com/sdks/sigweb.html) using the pad's exact model.
Download the official `SigWebTablet.js` from the same page and place it in
`<Vipex Desktop user data>/topaz/SigWebTablet.js` on each signing workstation. If the file is
missing, **Sign on Topaz** reports the full path on that workstation. Test the hardware in the
vendor demo first and then inside the installed Vipex Desktop app.

The desktop client checks that SigWeb returned points and a readable image with ink. The server
checks the bounded image and native signature data formats. Mobile uses the shared drawing pad,
and the server requires a visible stroke. The saved record ties the capture to the parcel,
collector, capture operator, and time. Topaz's native signature string is retained with the
image and omitted from list and preview responses. Neither capture method checks handwriting
against a known sample. OTP verifies access to the registered receiver phone where required.

## Data and failure handling

Migration `0094_receiver_cashier_signature` adds the branch setting and a private pending handover
field to parcels. The pending record holds the collector, associate, the payment and queue
references, and any saved signature. Completion moves the signature into the delivery confirmation
snapshot and adds a parcel history event without raw signature content. The server rejects wrong
branch, stale handover, missing signature, changed payment or pickup ticket, and open reconciliation
cases. Storage collected during preparation is checked against the amount accrued at that time.
An existing delivery reversal clears the active delivery snapshot.

## QA

- Start a two-parcel batch on desktop in each workflow and request mobile signing after OTP
  verification. Find it on Android and iOS using the second parcel's booking/tracking code.
  Review all members, save one signature and verify the open desktop preview updates. Confirm
  once and verify both parcels record that batch and mobile capture operator, with one payment
  per cashier parcel. An unselected third parcel must stay Awaiting Pickup.
- Retry mobile capture and desktop confirmation concurrently. Keep the first saved drawing,
  with one set of payments and deliveries. Change a ticket, receiver or balance before signing
  or confirmation and check the entire operation fails. Check expiry, wrong branch/company,
  wrong workflow permission and a cancelled/replaced request from a previously opened dialog.
- Automated coverage is in `tests/server/parcel-batch-signature.spec.ts`. Native screen and
  hardware QA remain device checks.

- With the setting on, open Receiver Cashier on desktop and Receiver Signatures on mobile.
  Process a parcel and verify it appears on mobile without a manual refresh. Check that it
  remains undelivered, the pickup ticket is open, and there is one payment. Keep the payment
  dialog open and verify it switches to waiting for the signature.
- Sign on mobile. Check that desktop shows Ready to confirm without a refresh, that the preview
  matches the drawing in the same open dialog, and that confirmation prints the receiver receipt
  and closes the ticket. Repeat by closing the dialog and reopening the unsigned handover from
  the list. Confirm the button stays disabled until the signature preview is ready.
- Repeat with the Topaz pad. Test clear, cancel, blank capture, unplugging the pad, reopening
  the app, and signing again. Include one combined principal and storage receipt.
- Try concurrent confirmations, no signature, an expired required OTP, and another branch or
  a user without permission. Verify no extra payment, delivery or automatic print.
- Turn the setting off with one parcel still pending. Verify the pending parcel can still be
  confirmed and the next Receiver Cashier payment follows the immediate delivery flow.
