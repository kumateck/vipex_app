# Parcel Printing

## Purpose

The application prints parcel stickers and A5 customer documents from the browser and the desktop application. Printing is part of parcel creation, payment, receiving, and reprint workflows, but a successful print is not the authority for whether the parcel or payment exists.

## Documents

| Document           | Purpose                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| Parcel sticker     | Tracking and routing label attached to each physical parcel.             |
| A5 receipt/invoice | Customer and transaction document containing parcel and payment details. |

The A5 document includes payer details where a payer differs from the sender or receiver.

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

| Area                              | Current state                                    | Gap                                                                           |
| --------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Processed-consignment reprint     | Provides a `1–20` quantity selector.             | Remove the maximum and replace the fixed options with positive-integer entry. |
| Parcel creation                   | Print flow defaults to one sticker.              | Expose per-parcel quantity before print.                                      |
| Sender payment                    | Sticker print defaults to one in relevant paths. | Expose and pass the selected quantity.                                        |
| Desktop parallel sticker/A5 print | Some jobs omit copies or log one.                | Pass the selected sticker quantity end to end.                                |
| Audit logging                     | Sticker usage endpoint accepts a copy count.     | Log the requested successful quantity consistently from every path.           |

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

- Print 1, 2, 20, 21, 100, and another user-entered positive whole number.
- Reject 0, negative, decimal, blank, text, infinity, and unsafe numeric input.
- Browser print produces exactly the requested sticker pages and one A5 page.
- Desktop sticker job receives the exact chosen copy count while A5 remains one.
- Each parcel in a multi-parcel booking can have a different copy count.
- Every sticker entry point found in the web, desktop, and mobile code inventory exposes and preserves the same quantity behavior.
- Cancelled print creates no successful usage entry.
- Successful reprint creates one usage event with the correct copies.
- Partial desktop success is reported and audited only for the successful sticker job.
