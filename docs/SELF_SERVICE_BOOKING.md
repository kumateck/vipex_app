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
courier charges and fragile handling, sender-only claims, force majeure, sender declaration, and
identification requirements for collection by receivers or third parties.

## Agent Workflow

Authenticated agents use permission-controlled routes to:

1. List available self-service drafts.
2. Open a draft and inspect its submitted details.
3. Claim it so another agent cannot complete it concurrently.
4. Confirm or add operational details and calculate the charge.
5. Choose payment responsibility: sender, receiver, or split.
6. Choose settlement such as pay now or approved credit, including supported partial settlement.
7. Complete the draft into the normal parcel workflow.
8. Print the resulting documents or recover through reprint if printing fails.

Reading drafts uses `CanReadSelfServiceBookings`. Claiming, completing, or cancelling uses `CanCompleteSelfServiceBookings`.

Printing a branch entry QR code uses `CanPrintSelfServiceQrCode`. This permission is listed under
**Branch Network Management** and can be assigned to a Branch Manager without granting branch edit
access. The role also needs `CanReadBranches` to open the branch list and load the selected branch.
For backward compatibility, `CanUpdateBranches` continues to allow printing.

The mobile agent workflow now supports listing, inspecting, claiming, and completing drafts with pay-now settlement. It supports sender, receiver, and split payment responsibility. Credit completion remains desktop-only until mobile exposes the same customer credit eligibility and cashier-session context. See [Mobile Frontline Workflows](MOBILE_FRONTLINE_WORKFLOWS.md).

## Draft States

| State     | Meaning                                                      |
| --------- | ------------------------------------------------------------ |
| Available | Submitted and ready for an agent to claim.                   |
| Claimed   | Reserved to an authenticated agent.                          |
| Completed | Converted into the authoritative booking and parcel records. |
| Cancelled | Intentionally closed without conversion.                     |
| Expired   | No longer valid because the allowed time elapsed.            |

Claim and completion operations must be concurrency-safe. A second agent must receive an explicit conflict rather than create a duplicate booking.

## Security and Abuse Controls

- Bind the temporary session to one company and branch.
- Apply short expiration and rate limits to session and draft creation.
- Validate all customer and parcel input on the server.
- Treat public prices, statuses, and identifiers as untrusted.
- Do not expose internal notes, permissions, other branches' drafts, or full customer records.
- Record claim, completion, cancellation, actor, branch, and timestamps for audit.

## Payment and Printing

Completion uses the same server payment and parcel rules as agent-created parcels. A pay-now sender flow requires an eligible cashier session. Receiver, split, credit, and partial choices remain permission- and validation-controlled.

Sticker copies must follow [Parcel Printing](PARCEL_PRINTING.md): the user enters any positive whole number with no application-defined maximum. A print failure after successful completion must not create a second parcel when retried.

## Failure and Recovery

- Expired or invalid public sessions require a fresh branch session.
- Invalid customer input keeps the draft form editable and does not leak account data.
- A lost claim should become available according to the configured recovery policy or be released by an authorized agent.
- Failed completion leaves the draft recoverable and does not create partial authoritative records.
- Successful completion with failed printing offers reprint from the created parcel.

## Verification Scenarios

- Valid QR/session creation and wrong-branch or expired-session rejection.
- Localhost print preview contains the development host LAN address, while production QR URLs keep
  the public HTTPS origin.
- Exact phone lookup with minimal response and rate limiting.
- New and existing sender/receiver combinations.
- Concurrent claim by two agents.
- Sender, receiver, split, pay-now, credit, and partial settlement.
- Cancellation, expiry, and claim recovery.
- Successful completion followed by print failure and reprint.
- Mobile read-only access, claim permission denial, pay-now sender/receiver/split completion, and credit-option absence.
- Branch and company isolation for public and staff routes.
- A role with `CanReadBranches` plus `CanPrintSelfServiceQrCode` can print the branch QR code but
  cannot edit the branch; existing roles with `CanUpdateBranches` retain print access.
- Terms dialog readability on mobile, unticked-by-default consent, blocked submission without
  consent, and server rejection of missing, false, or outdated terms versions.
