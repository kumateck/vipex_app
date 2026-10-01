# Public Parcel Tracking API

## Current behavior

The new application exposes an unauthenticated parcel lookup keyed by the parcel's
`trackingCode` (not its booking or receipt code):

```text
GET /v1/public/tracking/:trackingCode
```

The previous application-compatible URL remains available while clients migrate:

```text
GET /api/v1/bookings/:trackingCode/tracker
```

Both routes return the same JSON response and use the new application's database. A
successful response includes the tracking code, receipt code, source and destination branch
names, processing/sent/arrival times, sender and receiver names, packaging and contents,
parcel value, receiver amount due, total charge, current status, and a status timeline.
The money fields include numeric Ghana cedis for parcel value, receiver amount due, sender-paid
amount, and total charge. Dates are ISO 8601 strings or `null` when the event has not happened.
Internal user IDs, payment records, audit metadata, delivery signatures, and cashier/session data
are never returned.

An unknown or deleted tracking code returns `404` with the standard API error shape. The
endpoint is still covered by the global rate limiter because it is public and unauthenticated.
The API accepts requests from `https://vipexparcels.com` and `https://vipexparcel.com` for the
public tracking pages. The current legacy client sends `Access-Control-Allow-Origin` as a request
header; the API accepts that header for compatibility, although new clients should omit it because
it belongs in the server response.

## QA scenarios

1. Request either route with a valid parcel tracking code and verify both responses match.
2. Confirm a booking code that is not the parcel tracking code does not find the parcel.
3. Confirm the response includes source/destination branches, receiver, packaging, amount due,
   current status, and timeline timestamps.
4. Confirm a missing or soft-deleted tracking code returns `404`.
5. Confirm repeated requests beyond the configured public rate limit return `429`.
