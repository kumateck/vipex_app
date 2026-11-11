# Parcel handover notes

Open a parcel in **All Parcels Super Search** on web or **Super Search** on mobile and choose **Add handover note** to record a sender’s instruction for
the receiving branch. The note is attached to that parcel, including when several parcels share
a booking code. Users with `CanUpdateParcelHandoverNote` at the source or destination branch can
add or edit it on an active parcel before handover. An administrator assigns this permission
through the existing role editor. The note must contain 1–1,000 trimmed characters. Saving a
new note or changing its text records the actor and time in Parcel History. Staff add and edit notes from Super Search. The operational queues open the note for reading.

The **Critical note** button has a pulsing warning icon and opens the note. Staff with reduced
motion enabled see the same warning with a static icon. The alert is available as soon as the
note is saved, including while the parcel is in transit and has yet to be received. The web
scanner stops auto-receive for a scanned parcel with a critical note and offers **Mark arrived**
and **Dismiss scan**. The mobile scanner opens the existing parcel review screen, where the
note is available before confirmation.

| Web and desktop                                                  | Mobile                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| All Parcels Super Search and parcel details                      | Super Search results and parcel details                                  |
| In Transit (Receiving Branch) and incoming consignment checklist | Scan to Receive search and Receive Consignments checklist                |
| Scan to Receive                                                  | Scan to Receive and Process Incoming Parcel                              |
| Call Center Assignment                                           | Operations → Call Center Assignment queue lookup                         |
| Parcel Status (Call Receivers)                                   | Call Center Follow-up                                                    |
| Shelf Picker Update                                              | Operations → Shelf Picker Update queue lookup                            |
| Pickup Queue and queue boards                                    | Queue Management and queue boards                                        |
| Waiting for Pickup                                               | Waiting for Pickup results and handover panel                            |
| Receiver Cashier and pending handovers                           | Operations → Receiver Cashier queue lookup and Receiver Signatures queue |

Each queue retains its existing workflow eligibility. Search for a parcel before arrival through
Super Search, the incoming list, or Scan to Receive. The native queue lookups support search,
pagination and note review under their existing workflow grants. Assignment, shelf picker
updates and cashier payment collection continue through the web or desktop workflows.

Office delivery and rider handover permanently stop the pulse. **Handover note** remains
available from parcel history views such as Super Search details. Reversing delivery cannot
reactivate the alert, and the text remains read-only after delivery.

## API and rollout

- `GET /v1/shipments/parcels/:id/handover-note` returns `{ note, critical, canEdit }`. The
  authenticated company must match. Super Search readers can view company-wide. Staff with a
  supported receiving, call center, pickup, consignment or cashier grant can view the note at the
  source or destination branch. Responses use `Cache-Control: no-store`.
- `PATCH /v1/shipments/parcels/:id/handover-note` takes `{ note, expectedNote }` and returns the
  same response. Use `expectedNote: null` to add a note. A concurrent change or closed parcel
  returns 409, invalid input 400/422, missing permission 403, and missing, deleted or out-of-scope
  parcels 404. The note and its audit entry commit together.
- Internal parcel search/detail, consignment items, queue cards and pending handovers include
  `hasHandoverNote` and `handoverNoteCritical`. Parcel details also include `handoverNoteEditable`
  for parcel eligibility, with branch and permission checked separately. The note text is fetched separately. Public tracking
  and customer notifications exclude the note and its indicator.

Apply `0096_parcel_handover_note` before releasing the updated server and clients. The migration
adds the note and a durable delivery timestamp on `parcels`. A database trigger records office
delivery or rider handover, including through existing delivery routes. The migration does not
backfill historical delivery reversals that occurred before the feature was installed.

## QA scenarios

1. Add a note from Super Search at the source branch on an in-transit parcel. At the destination branch, find it
   by booking or tracking code in Super Search and the incoming queue. Open the alert and read
   the exact instruction on both clients.
2. Scan a noted parcel and verify the note is available before arrival. Scan a parcel without a
   note and verify the normal scan flow. On web, test both explicit arrival and dismissing the scan.
3. Move the parcel through each listed queue. Check that the warning can open and that a second
   parcel in the same booking does not inherit the note. Check reduced-motion settings.
4. Deliver at the office and by rider. Check the note remains visible as a static button, then
   reverse delivery and confirm it stays static and read-only.
5. Check branch, company and permission restrictions, blank and oversized notes, concurrent edits,
   history, and the absence of note data in public tracking and notifications.
