# Self-Service Booking

## Purpose

Self-service booking lets a customer prepare parcel details at a branch without granting access to the staff application. A staff member later claims, completes, prices, settles, and prints the draft through the authenticated workflow.

## Entry and Session

A branch QR code or self-service link identifies the branch. The public client creates a short-lived branch-bound session through:

- `POST /v1/self-service/sessions`

Subsequent public requests send the issued value in the `x-self-service-session` header. The session is not an employee login and must not authorize staff routes.

When the web application runs through Vite on `localhost`, the printable QR code replaces the
loopback hostname with the development machine's detected LAN IPv4 address while preserving the web
port. This lets a phone on the same network open the local self-service page. Set
`VITE_DEV_HOST_IP` when automatic interface selection picks the wrong address. Production and
already network-addressed origins remain unchanged.

## Public Capabilities

| Endpoint area   | Capability                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Branch          | Read the branch identity needed for the booking screen.                                                       |
| Customer lookup | Find an exact phone match and return only the limited customer identity required by the form.                 |
| Destinations    | List allowed branch and location destinations.                                                                |
| Draft creation  | Submit sender, receiver, destination, contents, value, call-sender preference, and explicit terms acceptance. |

Public responses must minimize personal data. Phone lookup must not expose a customer directory or fuzzy-search results.

## Draft Data

A draft can contain:

- Sender identity and contact details.
- Receiver identity and contact details.
- Destination branch or location.
- Parcel description, quantity, value, and other supported booking details.
- The `callSender` operational instruction.
- The customer-facing **CS — Call Sender before deliver to Receiver** option keeps the receiver's
  name and telephone on the booking and sticker. It instructs staff to call the sender before
  handover; it does not replace the receiver contact or block receiving.
- The accepted terms version and server-recorded acceptance time.
- Branch and session attribution.
- Creation and expiry timestamps.

The draft is not a parcel, tracking number, payment, or completed booking until an authorized agent completes it.

## Terms and Conditions Consent

The review stage shows a required, unticked consent checkbox. The full courier-service terms remain
inside a scrollable dialog and open only when the customer taps **Terms & Conditions**. The customer
must explicitly tick the checkbox before **Confirm Parcel** can submit the draft.

The server rejects omitted, false, or outdated consent even if browser validation is bypassed. Every
accepted draft records terms version `2026-08-29` and a server-generated acceptance timestamp. The
terms cover mandatory inspection, prohibited items, declared-value liability, storage charges,
courier charges and fragile handling, sender-only claims, force majeure, data protection, sender
declaration, and identification requirements for collection by receivers or third parties.

## Agent Workflow

Authenticated agents use permission-controlled routes to:

1. List available self-service drafts.
2. Open a draft and inspect its submitted details.
3. Claim it to reserve the draft in the staff queue.
4. Confirm or add operational details and calculate the charge.
   Select **Agent who charged the parcel** from active staff at the source branch. This is an
   explicit required selection on web, desktop, and mobile; it may differ from the completing
   officer. The resulting parcel stores `chargeAgentUserId`, separate from `createdBy` and
   `processedBy`. The public draft form does not select a staff agent.
   The officer can keep or change the draft's CS checkbox while entering the charge. Omitted CS
   on older completion clients retains the customer's draft choice; an explicit `false` clears it.
5. Choose payment responsibility: sender, receiver, or split.
6. Choose settlement such as pay now or approved credit, including supported partial settlement.
7. Complete the draft into the normal parcel workflow.
8. Print the resulting documents or recover through reprint if printing fails.

Reading drafts uses `CanReadSelfServiceBookings`. Claiming, completing, or cancelling uses `CanCompleteSelfServiceBookings`.

Printing a branch entry QR code uses `CanPrintSelfServiceQrCode`. This permission is listed under
**Branch Network Management** and can be assigned to a Branch Manager without granting branch edit
access. The role also needs `CanReadBranches` to open the branch list and load the selected branch.
For backward compatibility, `CanUpdateBranches` continues to allow printing.

The mobile agent workflow is available from both the navigation drawer and Operations Hub. It supports
listing, inspecting, claiming, and completing drafts with pay-now settlement. Opening an available
draft claims it before the completion form is shown. It supports sender, receiver, and split payment
responsibility. Credit completion remains desktop-only until mobile exposes the same customer credit
eligibility and cashier-session context. See
[Mobile Frontline Workflows](MOBILE_FRONTLINE_WORKFLOWS.md).
Both web and mobile completion forms expose the editable CS choice, prefilled from the draft.

`GET /v1/self-service/charge-agent-options` requires `CanCompleteSelfServiceBookings` and returns
only `{ id, fullname }` for active users in the authenticated company and source branch. It does
not require `CanReadUsers`. Completion accepts optional `chargeAgentUserId` for older-client
compatibility: omitted/null values remain unassigned. Supplied IDs must be active and in that
company/branch; invalid selections reject the booking transaction and leave the draft uncompleted.
Current clients require a selection, offer retry after lookup failure, and block completion when
there are no available agents. See [Parcel Operations](PARCEL_OPERATIONS.md#agent-who-charged-the-parcel)
for migration `0080`, deploy order, historical NULL attribution, and production validation.

## Staff Search and Customer Corrections

On web and desktop, **Self-Service Bookings** uses the shared client-mode DataTable with
search, sorting, pagination, horizontal table scrolling and a viewport-height scroll wrapper.
The existing branch-scoped draft list is still loaded as an array; this change does not add
server pagination. Search includes sender/receiver names, both phone numbers, content and
status. Loading, request failure and empty results are distinct states.

**View / Edit** opens the submitted sender/receiver names, primary phone, backup phone,
parcel content and value without claiming the draft. Readers can inspect the dialog;
`CanCompleteSelfServiceBookings` enables correction and the existing Complete action.
The completion page also has **Edit Customer Details**. Saved corrections refresh the draft
summary, queue and customer caches. Editing contacts preserves an in-progress charge,
charge-agent selection, payment responsibility and destination on the completion form.
Mobile keeps its existing inspection/completion workflow; no new native contact editor or
DataTable is introduced by this change. The public customer form remains unchanged.

`PATCH /v1/self-service/drafts/:id/customers` accepts `sender` and `receiver` objects
(`fullname`, `phone`, optional/null `phone2`) plus the currently displayed `expectedUpdatedAt`.
Names are trimmed and must contain 1–255 characters. Phone separators are removed and
primary/filled backup numbers must contain exactly ten digits. Blank backup numbers become
NULL. Corrections are restricted to unexpired Pending/Claimed drafts in the authenticated
company and branch; another officer's claim, a stale timestamp, or a completed/cancelled
draft is rejected. The same main number must have consistent sender/receiver details.

An unchanged contact retains its customer link. A changed primary number is resolved against
active customers in the same company; a new number detaches the previous customer and is
resolved/created during normal completion. Existing matching customer profile corrections
also require `CanUpdateCustomers` and update that customer's name/phone information. Numbers
matching different customers are rejected. Draft and saved-profile changes, including audit
records, commit or roll back together. There is no payment or parcel creation during editing.
Historical parcel name snapshots retain their existing behavior.

QA: search large queues and both phone fields; scroll and paginate; inspect without completion
permission; correct new and saved contacts; verify customer-update permission denial rolls back
all changes; change a primary number without rewriting the old profile; test invalid phones,
foreign/expired/completed drafts, another officer's claim, conflicting phone ownership and
stale edits. Save contacts after entering pricing and verify those fields stay filled. Complete
and confirm the corrected contacts are attached to the new parcel.
Coverage: `draft-customer.rules.test.ts`, `self-service-draft-customer.service.spec.ts`.
The existing completion-orchestration concurrency limitation below remains unchanged.

## Draft States

| State     | Meaning                                                      |
| --------- | ------------------------------------------------------------ |
| Available | Submitted and ready for an agent to claim.                   |
| Claimed   | Reserved to an authenticated agent.                          |
| Completed | Converted into the authoritative booking and parcel records. |
| Cancelled | Intentionally closed without conversion.                     |
| Expired   | No longer valid because the allowed time elapsed.            |

Claim and completion operations must be concurrency-safe. A second agent must receive an explicit conflict rather than create a duplicate booking.

Implementation limitation: the claim transition is conditional, but completion currently accepts
pending or claimed drafts without checking the claim owner. It commits the booking before marking
the draft completed. Concurrency-safe completion above is a requirement, not a current guarantee;
charge-agent attribution does not resolve that existing limitation.

## Security and Abuse Controls

- Bind the temporary session to one company and branch.
- Apply short expiration and rate limits to session and draft creation.
- Validate all customer and parcel input on the server.
- Treat public prices, statuses, and identifiers as untrusted.
- Do not expose internal notes, permissions, other branches' drafts, or full customer records.
- Record claim, completion, cancellation, actor, branch, and timestamps for audit.

## Payment and Printing

Completion uses the shared booking service with `requireActiveCashierSession: false`, no sender
payment, and initial `CREATED` status. Pay-now bookings are queued for sender cashier completion;
credit remains subject to sender eligibility and limit validation. This current behavior supersedes
the previous documentation's claim that self-service completion immediately requires a cashier session.

Sticker copies must follow [Parcel Printing](PARCEL_PRINTING.md): the user enters any positive whole number with no application-defined maximum. A print failure after successful completion must not create a second parcel when retried.

## Failure and Recovery

- Expired or invalid public sessions require a fresh branch session.
- Invalid customer input keeps the draft form editable and does not leak account data.
- A lost claim should become available according to the configured recovery policy or be released by an authorized agent.
- Failed completion leaves the draft recoverable and does not create partial authoritative records.
- Successful completion with failed printing offers reprint from the created parcel.

## Verification Scenarios

- Web/desktop/mobile officers must select the agent alongside the authoritative charge; verify
  the parcel stores that agent while `createdBy`/draft `completedBy` still identify the submitting officer.
- Invalid, inactive, wrong-company, and wrong-branch agents reject completion without creating a
  booking/parcel/payment; the draft stays available for correction. Verify failed lookup, retry,
  no available staff, and older requests with no agent producing NULL attribution.

- Valid QR/session creation and wrong-branch or expired-session rejection.
- Localhost print preview contains the development host LAN address, while production QR URLs keep
  the public HTTPS origin.
- Exact phone lookup with minimal response and rate limiting.
- New and existing sender/receiver combinations.
- Concurrent claim by two agents.
- Sender, receiver, split, pay-now, credit, and partial settlement.
- Customer selects or clears CS; web/mobile officers keep or change it during pricing; completed
  parcel and portrait/landscape sticker reflect the final choice while showing receiver contacts.
- Older completion requests without `callSender` retain the draft choice; explicit `false`
  clears a previously selected choice. A failed completion does not alter the draft.
- Cancellation, expiry, and claim recovery.
- Successful completion followed by print failure and reprint.
- Mobile read-only access, claim permission denial, pay-now sender/receiver/split completion, and credit-option absence.
- Branch and company isolation for public and staff routes.
- A role with `CanReadBranches` plus `CanPrintSelfServiceQrCode` can print the branch QR code but
  cannot edit the branch; existing roles with `CanUpdateBranches` retain print access.
- Terms dialog readability on mobile, unticked-by-default consent, blocked submission without
  consent, and server rejection of missing, false, or outdated terms versions.
