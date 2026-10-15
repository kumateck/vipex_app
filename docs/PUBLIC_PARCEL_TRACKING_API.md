# Public Parcel Tracking API

## Current behavior

The new application exposes one unauthenticated parcel lookup keyed by the parcel's
`trackingCode` (not its booking or receipt code):

```text
GET /v1/public/tracking/:trackingCode
```

The endpoint uses the new application's database. A successful response includes the tracking
code, receipt code, source and destination branch names, processing/sent/arrival times, sender and
receiver names, packaging and contents, parcel value, receiver amount due, total charge, current
status, and a status timeline.
The money fields include numeric Ghana cedis for parcel value, receiver amount due, sender-paid
amount, and total charge. Dates are ISO 8601 strings or `null` when the event has not happened.
Timeline events are returned in timestamp order, including inferred destination arrival events.
If the latest status has no audit event, the current parcel status and update time are included
so the timeline still reflects the latest state.
For a rider-returned parcel, the current status label is **Returned by rider to office** until
staff reprocess it for pickup or redispatch. This is distinct from a return to the sender/source.
Internal user IDs, payment records, audit metadata, delivery signatures, and cashier/session data
are never returned.

An unknown or deleted tracking code returns `404` with the standard API error shape. A `404`
containing `"message": "Route not found"` means the server does not have this endpoint; it is not
evidence that the tracking code is absent. The old `/api/v1/bookings/:code/tracker` URL and other
legacy aliases are not supported. The endpoint is still covered by the global rate limiter because
it is public and unauthenticated.
The API accepts requests from `https://vipexparcels.com` and `https://vipexparcel.com` for the
public tracking pages. The current website client sends `Access-Control-Allow-Origin` as a request
header; the API accepts that header for compatibility, although new clients should omit it because
it belongs in the server response.

## QA scenarios

1. Request the canonical route with a valid parcel tracking code and verify the response.
2. Confirm a booking code that is not the parcel tracking code does not find the parcel.
3. Confirm the response includes source/destination branches, receiver, packaging, amount due,
   current status, and timeline timestamps.
4. Confirm a missing or soft-deleted tracking code returns `404`.
5. Confirm repeated requests beyond the configured public rate limit return `429`.
6. Confirm the canonical route is registered while legacy aliases return `Route not found`.
7. After deploying the server build, repeat the lookup on the production host; local route tests do
   not verify which image is currently serving production.
8. Return a dispatched parcel from its rider and verify tracking shows **Returned by rider to
   office**; after pickup reprocessing or redispatch, verify the current status changes.
