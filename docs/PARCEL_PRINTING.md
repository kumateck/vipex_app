# Parcel Printing

## Purpose

The application prints parcel stickers and A5 customer documents from the browser and the desktop application. Printing is part of parcel creation, payment, receiving, and reprint workflows, but a successful print is not the authority for whether the parcel or payment exists.

## Documents

| Document                 | Purpose                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Parcel sticker           | Tracking and routing label attached to each physical parcel.                                |
| A5 receipt/invoice       | Customer and transaction document containing parcel and payment details.                    |
| A5 home delivery receipt | Per-parcel delivery document printed from Home Delivery Dispatch or Rider Assigned Parcels. |
| A4 consignment           | Saved source-to-destination parcel manifest that can be printed again.                      |

The A5 document includes payer details where a payer differs from the sender or receiver.
Home Delivery Dispatch and Rider Assigned Parcels offer **Print** on each parcel row, including
current rider assignments and completed rider history. The print action
loads current amounts from a read-only, branch-scoped endpoint and produces one A5 document through
the browser or the configured desktop A5 printer. The receipt shows the full parcel charge and
delivery fee, previous principal and delivery-fee payments, and the amount due on delivery. A
fully paid parcel owes only the unpaid delivery fee; an unpaid or partially paid parcel owes its
remaining principal plus the unpaid delivery fee. Voided payments do not reduce the balance.

The home delivery receipt calculates the tax breakdown when opened from the full parcel charge
plus full delivery fee. It uses the active company tax profile, or the default Ghana tax rules if
none is configured. The tax box shows the net price, configured components, and full charge plus
delivery fee total. The amount due on delivery is shown separately after previous payments; no
receipt tax calculation is saved. A parcel outside the authenticated dispatch branch, a parcel
outside the address-collected/returned-to-office queue, or a parcel without an active doorstep
delivery fee cannot generate this receipt. Load or print failures show an error and leave parcel
and payment records unchanged. QA: print paid, unpaid, and partial parcels; verify fee-only and
combined balances; void a payment and confirm a new print reflects the increased balance; compare
tax components against the active tax profile; print a current rider assignment and a completed
history row; check browser and desktop A5 printing.
For taxable principal payments, the A5 tax summary prints only the configured tax components from
the payment response. The payment response carries the configured component keys, so an unset
VAT, GETFUND, NHIL, or COVID component is not printed as a zero row.
If no company tax profile is configured, the payment service applies the default Ghana tax
calculator.
Paid sender and receiver receipt flows now require the payment response to include its tax
breakdown before creating the receipt; they fail visibly instead of printing a paid receipt with
silently substituted zero tax values.

Both sender payment receipts and receiver acknowledgement notes include these terms:

- Parcels not collected within two weeks will incur a daily storage fee of GH₵2.
- Information collected will be used only for the intended purpose and handled in accordance with applicable data protection requirements.

The shared A5 receipt header also lists Techiman (`0559085369`) and Tamale (`0502638678`) contact numbers.

## QR Print and Stock Standard

Parcel QR codes require an opaque white background with an uninterrupted white quiet zone on all
four sides. The printed QR uses solid black modules, no center logo, Q-level error correction, and a
larger physical footprint on parcel stickers. Blue, dark, transparent, patterned, or reflective
stock must not occupy the QR area: thermal printers cannot print white ink to correct dark stock.
The parcel sticker must not print a booking or tracking code directly beneath the QR. Manual lookup
remains available in the receiving application when a QR cannot be scanned.

New parcel stickers must use white label stock or stationery with a factory-produced opaque white
QR panel. For blue stickers already in circulation, staff must completely cover the old QR with a
white QR-only overlay label of at least 30 mm square, or use manual code search. Do not place clear
tape or glossy wrapping over the QR because glare can hide finder patterns.

## Intended Sticker Copy Rule

This is the canonical requirement for every sticker-print entry point across the entire application:

- The user specifies the number of sticker copies to print.
- The value must be a positive whole number: `1, 2, 3, ...`.
- There is no application-defined maximum and no `1–20` restriction.
- The default is one copy.
- Every copy is the same sticker for the same parcel and tracking code.
- A multi-parcel transaction has a separate copy quantity for each parcel.
- Sticker quantity does not change the number of A5 documents; an A5 print remains one copy unless a separate A5-copy feature is introduced.
- Clients must not silently clamp, replace, or reduce the requested value.
- Device or operating-system limits can still cause a print failure; that failure must be shown to the user.
- There are no workflow exceptions: if an area can print or reprint a sticker, it must allow the user to enter the sticker copy quantity before submitting the print job.
- This requirement applies to web, desktop, mobile, present workflows, and any future sticker-printing workflow.

Validation must reject empty, zero, negative, decimal, non-numeric, infinite, and unsafe numeric values. The server audit endpoint must validate the same positive-integer contract.

## Universal Availability

Sticker quantity must be implemented as a shared capability and used everywhere a sticker can be printed. It must not be implemented only on selected pages or independently with different limits.

Before a sticker-printing change is considered complete, the implementation must inventory every call site that renders, previews, queues, routes, prints, or reprints a sticker and confirm that the chosen quantity is preserved end to end.

## Known Sticker Areas

| Workflow                        | Required behavior                                                |
| ------------------------------- | ---------------------------------------------------------------- |
| Parcel creation                 | Choose sticker copies before printing each newly created parcel. |
| Sender payment                  | Choose sticker copies alongside the existing print decision.     |
| Receiver payment or completion  | Choose sticker copies when a sticker is printed or reprinted.    |
| Processed consignment reprint   | Enter any positive whole number, not a capped selector.          |
| Parcel details or other reprint | Use the same shared quantity control and validation.             |
| Desktop parallel print          | Pass the chosen quantity to the sticker printer job.             |

This table records known workflows but is not an exhaustive allowlist. Any sticker-print entry point discovered elsewhere is automatically subject to the same requirement.

## Shared Implementation Contract

- Use one shared quantity input, parser, and validation contract across sticker workflows.
- Keep the selected quantity in the print request until it reaches the browser page generator or native printer job.
- Never replace the selected quantity with a hardcoded `1` in a wrapper, fallback, parallel-print helper, IPC bridge, or audit call.
- New sticker-print entry points must adopt the shared capability before release.
- Automated coverage should fail when a sticker print path omits the quantity or introduces an application maximum.

The quantity control should be a numeric text or number field that permits direct entry. A fixed dropdown is unsuitable because the valid range is intentionally unbounded.

## Current Implementation Status

The repository does not yet meet the intended rule everywhere.

| Area                              | Current state                                  | Gap                                                                 |
| --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| Processed-consignment reprint     | Accepts any positive whole-number quantity.    | Implemented on web and desktop.                                     |
| Parcel creation                   | Manual print exposes per-parcel quantity.      | Automatic post-submit print still defaults to one.                  |
| Sender payment                    | Manual print exposes and passes the quantity.  | Automatic post-payment print still defaults to one.                 |
| Desktop parallel sticker/A5 print | Passes and logs the selected sticker quantity. | Implemented for the shared sender-payment print path.               |
| Audit logging                     | Sticker usage endpoint accepts a copy count.   | Log the requested successful quantity consistently from every path. |

This table is a documented implementation mismatch, not permission to retain the current cap.

## Browser Printing

Browser printing renders the sticker document into printable pages. For `N` copies, the sticker page must be repeated `N` times in the print document. The print preview remains the final browser-controlled confirmation.

The application must:

- Build the correct number of identical sticker pages.
- Keep page size and label layout unchanged for every copy.
- Avoid duplicating the A5 document when only sticker copies were requested.
- Report rendering or print-window failures without changing parcel state.

## Desktop Printing

The desktop application can route sticker and A5 jobs to different configured printers. The sticker job must carry the selected `copies` value; the A5 job remains independent.

Parallel printing should:

1. Resolve the mapped sticker and document printers.
2. Submit both jobs without making one wait unnecessarily for the other.
3. Pass the requested copies only to the sticker job.
4. Return the result of each job independently.
5. Show partial success, such as sticker printed but A5 failed.

Printer routing settings determine the destination printer, not the number of copies.

## Print Availability

After parcel creation, printing is available only when the workflow and account permit it. Sending and full cashiers collecting sender payment require the relevant payment permission and an active session. Reprinting remains a separate permission-controlled operation.

Print permission must be enforced independently from parcel creation permission.

Saved A4 consignments can be retrieved from `/parcels/consignments/history` using a single date or
inclusive date range. Reprinting requires `CanReadConsignments`; agency users are limited to
consignments created from their authenticated branch, while head-office users may filter across
company branches. The document is reconstructed from active saved consignment items and uses the
same routed browser/desktop A4 print path as the initial print.

## Audit Logging

Sticker print usage is recorded through `POST /v1/shipments/parcels/sticker-prints`. The record stores company, branch, parcel, booking, tracking number, actor, number of copies, and print time.

Rules:

- Log only after the application receives a successful print result.
- Store the actual sticker copies submitted successfully.
- Do not log A5 copies as sticker copies.
- A retry is a new print event and should be recorded separately after success.
- The Sticker Print Usage report aggregates these events for operations and audit review.

## Error Handling

- If the parcel was created but printing failed, keep the creation success and offer reprint.
- If one desktop job succeeds and the other fails, show both results explicitly.
- Do not log a failed or cancelled print as successful usage.
- If usage logging fails after a successful physical print, show a non-destructive warning and allow an auditable retry strategy; do not print another copy automatically.
- Never convert an invalid value to one without telling the user.

## Acceptance Scenarios

- Print on approved opaque white stock and scan from several Android devices under normal and dim
  branch lighting.
- Confirm the QR has a white quiet zone, no logo over its modules, and no clipping at label edges.
- Confirm portrait and landscape stickers contain no human-readable booking or tracking code below
  the QR.
- Reject blue or dark stock without an opaque white QR panel; verify an existing blue label can be
  recovered with a white 30 mm overlay label or manual code entry.
- Print 1, 2, 20, 21, 100, and another user-entered positive whole number.
- Reject 0, negative, decimal, blank, text, infinity, and unsafe numeric input.
- Browser print produces exactly the requested sticker pages and one A5 page.
- Desktop sticker job receives the exact chosen copy count while A5 remains one.
- Each parcel in a multi-parcel booking can have a different copy count.
- Every sticker entry point found in the web, desktop, and mobile code inventory exposes and preserves the same quantity behavior.
- Cancelled print creates no successful usage entry.
- Successful reprint creates one usage event with the correct copies.
- Partial desktop success is reported and audited only for the successful sticker job.
- A portrait to-be-paid sticker reserves at least 11 mm for Parcel Details, keeps the complete value
  inside the outer border, and leaves bottom cut clearance on the 100 mm stock.
- Test parcel-detail values at short, medium, and maximum supported lengths on both browser and
  desktop printing; no label or value may be clipped by the next row or the paper cut boundary.
