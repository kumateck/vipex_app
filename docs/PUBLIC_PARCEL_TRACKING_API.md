# Public Parcel Tracking API

## Current behavior

The new application exposes one unauthenticated parcel lookup keyed by the parcel's
`trackingCode` (not its booking or receipt code):

```text
GET /v1/public/tracking/:trackingCode
```

The endpoint uses the new application's database. Because it is anonymous and tracking codes are
printed as QR codes, it returns only what the public website shows:

| Field                                                | Notes                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `trackingCode`, `receiptCode`                        | `receiptCode` is the booking code                                                         |
| `sourceBranch`, `destinationBranch`                  | Branch names                                                                              |
| `processingTime`, `sentTime`, `reachedDestinationAt` | ISO 8601 or `null`                                                                        |
| `receiver.name`                                      | **Masked on the server**: `Ama Owusu` → `Ama O****`, `Kwame` → `Kw***`; `null` when blank |
| `packaging`                                          | Parcel details text, e.g. `1 M/BB`                                                        |
| `receiverToPayCedis`, `senderPaidCedis`              | Numeric Ghana cedis                                                                       |
| `status`                                             | `{ code, label }`                                                                         |
| `updatedAt`                                          | ISO 8601                                                                                  |
| `timeline`                                           | `[{ status, label, occurredAt }]`                                                         |

The response does **not** include the sender's name, the full receiver or second-receiver name,
declared contents, declared value, total charge, consignment code, or any phone number or email.
The website's masking (`maskName`) gives the same result on an already-masked name, so the website
needs no change. Dates are ISO 8601 strings or `null` when the event has not happened.
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
legacy aliases are not supported.

Rate limits: the endpoint is covered by the global rate limiter, and it also has its own per-IP
lookup quota so that tracking codes cannot be guessed at the global rate:

- `PUBLIC_TRACKING_RATE_LIMIT_MAX_REQUESTS` lookups (default `60`) per
  `PUBLIC_TRACKING_RATE_LIMIT_WINDOW_SECONDS` (default `600`) per client IP.
- The quota counts every lookup, found or not. The IP is taken from the first
  `X-Forwarded-For` entry, which the reverse proxy must overwrite, and is stored only as a SHA-256
  hash in the shared cache key.
- When the quota is spent the API returns `429` with `Retry-After` set to the window and
  `{ "error": { "code": "RATE_LIMITED", ... } }`, before the database is queried.
- The website treats `429` like any other failed lookup ("we couldn't check this code, try
  again"), never as "unknown code".
- Many mobile users can share one carrier IP (CGNAT). If legitimate users are refused, raise the
  limit through the environment variables rather than removing the quota.
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
5. Confirm repeated requests beyond the tracking quota (default 60 per 10 minutes per IP) return
   `429` with `Retry-After`, and that the website then shows its "couldn't check" message.
   5a. Confirm the response contains a masked receiver name and no sender name, contents, value,
   total charge, consignment code, phone number or email.
6. Confirm the canonical route is registered while legacy aliases return `Route not found`.
7. After deploying the server build, repeat the lookup on the production host; local route tests do
   not verify which image is currently serving production.
8. Return a dispatched parcel from its rider and verify tracking shows **Returned by rider to
   office**; after pickup reprocessing or redispatch, verify the current status changes.
