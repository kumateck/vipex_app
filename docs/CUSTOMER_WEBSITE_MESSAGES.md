# Customer website messages

VIPEX's public website accepts enquiries, complaints and feedback into a dedicated
customer inbox. These records do not create or change `cs_tickets`, IT support
tickets, conversations, customer profiles or parcel records. The inbox has no
internal-communication or IT-support module dependency.

## Public website API connections

The public website (`vipex_website`) calls the API base `https://app.vipexparcels.com/v1`.
All three endpoints it uses are served by this backend:

| Website feature                                                               | Endpoint                         | Backend                                                 | Status                                                     |
| ----------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| Track page and QR links (`/track/:code`, `/tracker/:code`, `/tracking/:code`) | `GET /v1/public/tracking/:code`  | `src/server/features/public-tracking/`                  | Implemented and deployed                                   |
| Receipt links (`/receipt/:token`, `/r/:token`)                                | `GET /v1/public/receipts/:token` | `src/server/features/digital-receipts/public.routes.ts` | Implemented and deployed (needs `digital_receipts` module) |
| Contact form (`/contact`)                                                     | `POST /v1/public/contact`        | `src/server/features/public-contact/`                   | Implemented; **not yet migrated or deployed**              |

- Tracking and receipt responses contain every field the website reads. Tracking returns only
  those fields, with the receiver name masked, and has its own per-IP quota
  ([Public tracking API](PUBLIC_PARCEL_TRACKING_API.md)). Phone numbers on the online receipt copy
  are masked ([Digital receipts](DIGITAL_RECEIPTS.md#public-receipt-endpoint)).
- The receipt link base `PUBLIC_RECEIPT_BASE_URL` defaults to `https://vipexparcels.com/receipt`,
  which matches the website's receipt route.
- Cross-site browser access works because the global CORS plugin reflects any origin. The contact
  endpoint additionally rejects browser origins other than the production website (see Abuse
  controls).

## Customer and staff workflows

The website sends `POST /v1/public/contact`. A successful durable database commit
returns HTTP 201 with `{ "reference": "WEB-…" }`. No customer data or internal note
is returned. There is no anonymous message lookup or update endpoint.

Authorized staff open **Commercial → Customer Master → Customer Messages** at
`/customer-messages`. They can filter by message type and status, page through
messages, and inspect contact details and handling history. Read access requires
`CanReadCustomerMessages`. Saving a status or private note requires that permission
and `CanManageCustomerMessages`. IT-support permissions grant no access. Company
scope always comes from the authenticated user. Access is company-wide for the
staff roles explicitly granted these permissions.

In **Roles → Permissions** both keys appear under **Commercial → Customer Lifecycle →
Customer Website Messages** (group `Customer Messages`, mapped in
`src/shared/permissions/ui-metadata-mapping.ts`). Every permission group needs an entry
there: an unmapped group makes the web app throw "Permission UI metadata missing group
mappings" when it loads. `src/shared/permissions/ui-metadata.test.ts` guards this.

Statuses are `new`, `in_progress`, `resolved` and `spam`. Staff may reopen a message.
Updates include the last `updatedAt` value; stale updates return 409 and require a
refresh. Status changes and private notes are recorded atomically with the update,
including the acting staff ID. Saving does not email, SMS or otherwise reply to a
customer. The customer can be contacted using the supplied details. No automatic
outbound notifications are implemented.

Web and desktop use the shared inbox page. Mobile has no dedicated inbox screen;
the same authenticated API is available to a future mobile client.

## API and validation

- `POST /v1/public/contact`: public, JSON; required `type`, `name`, `phone`, `message`;
  optional `email`, `branch`, `trackingCode`, `submissionId` and empty `website` honeypot.
- `GET /v1/customer-messages`: authenticated list returning
  `{ items, total, page, pageSize }`; optional type/status filters, page defaults to
  1, pageSize defaults to 25 and is capped at 100. Pagination accepts integers.
- `GET /v1/customer-messages/:id`: message and private `events` history.
- `PATCH /v1/customer-messages/:id`: `{ status, updatedAt, note? }`, returns the
  updated message. A foreign-company ID returns the same 404 as an unknown ID.

Types are exactly `enquiry`, `complaint`, `feedback`. Names are trimmed, 2–120
characters. Phones contain 9–13 digits, at most 32 characters, and only phone
punctuation. Email is optional, validated, and limited to 254 characters. Messages
are trimmed, 10–5000 characters. Branch text is at most 120 characters and tracking
codes at most 50. These two fields are customer-supplied labels, never trusted
foreign keys; submitting a code never reads or modifies a parcel. Staff notes are
at most 2000 characters. Text is displayed through React text nodes, without HTML.

Schema and semantic errors return 400 in the production API; missing authorization
returns 401, insufficient permission or disallowed browser origin 403, missing
records 404, conflicting retries/stale edits 409, and the contact quota returns 429
with `Retry-After: 900`. Missing/invalid/deleted company configuration returns 503.
Storage failures never return a successful acknowledgement. Private API responses
use `Cache-Control: no-store` and `X-Robots-Tag: noindex`.

The website supplies a UUID `submissionId`. It retains that ID for retries of an
unchanged message while the form remains open; edited fields produce a new ID.
The server derives the record ID from the configured company and that UUID.
Concurrent retries return one reference and create one record/history event.
Reusing a UUID with changed content returns 409. Callers omitting the optional
UUID do not receive retry deduplication.

## Abuse controls

Contact submissions have a separate quota of 5 attempts per IP per 15 minutes,
in addition to the API's existing global quota. The shared cache abstraction is
used; its memory fallback limits per process. A multi-instance deployment must
provide a working shared cache or enforce the same policy at the edge.
Production browser origins are restricted to `https://vipexparcels.com` and
`https://www.vipexparcels.com`; localhost development origins are accepted outside
production. Origin checks are not bot authentication. Server validation, the
honeypot and quotas apply to direct API requests too. IPs are hashed in quota keys
and not stored in message records. The trusted reverse proxy must overwrite
`X-Forwarded-For`; direct backend traffic without it shares an `unknown` bucket.

## Deployment

1. Back up and validate the target database according to the normal deployment
   process, then apply the vetted additive `0086_customer_website_messages.sql`
   through `bun run migrate`. It creates `website_contact_messages` and
   `website_contact_message_events` with indexes and company/user foreign keys.
   Review all other pending migrations before running the migrator.
2. Set backend `WEBSITE_CONTACT_COMPANY_ID` to the actual active VIPEX company ID.
   Find it with a read-only query such as
   `SELECT id, name, code FROM companies WHERE is_deleted = false AND code = 'VIPEX';`.
   Do not select an arbitrary first company or accept company IDs from the public
   request. Omit the variable until configured; the public endpoint then fails
   closed with 503. It is not a website build-time variable.
3. Deploy/restart the backend with the new routes. Build/deploy the ERP web client
   using `bun run build:web` (and the normal desktop release if needed). Assign the
   new read/manage permissions to the intended customer-service roles through
   Roles administration. Existing staff roles are not silently granted access.
   (`bun run seed:permissions:system-admin` grants every catalog permission, including these,
   to System Admin roles only.)
4. Build the public website with `pnpm build` and upload the **contents** of
   `build/client/`, including `.htaccess`, to the Apache document root. The website
   already targets `https://app.vipexparcels.com/v1`.
5. On staging, submit one test enquiry, complaint and feedback, verify each appears
   in the separate inbox, then test a status/note update and permission denial.
   Verify tracking and an authorized receipt link still work. Never submit private
   tracking or receipt URLs to search engines or external audit services.

Copying public website files alone cannot deploy the backend or database migration.
No production migration, permission grant or deployment is performed by this change.

## Verification

- `bun test tests/server/public-contact.spec.ts`: public contract, types, validation,
  spam trap, tenant derivation, error responses, CORS, quota and separate permissions.
- `bun test tests/server/public-contact.routes.spec.ts`: app route registration and
  unauthenticated staff access.
- `WEBSITE_CONTACT_DB_TEST=1 TEST_DATABASE_URL=postgres://…/vipex_website_contact_test bun test tests/server/public-contact.database.spec.ts`:
  real migration, durable storage, concurrent retries, company isolation, stale
  edits, atomic history, failure rollback and separation from both ticket tables.
  This test refuses a nonlocal or nonempty database and never uses production data.
- Website contact tests cover validation, durable acknowledgement requirements,
  stable retry IDs, edited-message IDs, success and the phone fallback.

Last recorded run (2026-10-17):

- Typecheck, ESLint, Prettier, and the architecture, scrollable-wrapper, date-picker and
  file-size lint rules pass.
- `public-contact.spec.ts` (8 tests), CORS, public tracking and public receipt tests pass.
- **Not run:** `public-contact.routes.spec.ts` and the database spec. The development machine
  ran out of disk space (Bun `WriteFailed`). Run both before deploying.
- The staff inbox page has not been checked in a browser yet.
