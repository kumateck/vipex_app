# Native Device Registration

## Current behavior

`device_verification` is an optional, company-scoped module, disabled until a head-office user
with `CanManageCompanyModules` enables it in Company Modules. When disabled, mobile and desktop
staff can sign in, refresh, and use authenticated APIs without a registered device; an existing
blocked or pending credential does not prevent a new sign-in. When enabled, the approval checks
below apply immediately. Registration can still be requested while the module is off to prepare
for enablement, but its pending status does not gate access. Browser sign-in is unchanged in
either state.

Mobile and Electron desktop installations present **Register this device** on the sign-in screen.
The staff member supplies their account email and password. The server verifies the account and
creates a pending device registration, then returns a one-time opaque credential. Android/iOS
store it in the OS keychain; Electron encrypts it with the OS secure-storage service in its
application-data directory. The server stores only its SHA-256 hash. No fingerprint, face,
biometric template, contact list, IMEI, advertising ID, or device serial is collected.

Registration records the account/company, client kind, device name/model when available,
operating system/version, app version when available, request user-agent/IP, request time,
reviewer, reason, and last sign-in or refresh time. Metadata is informational, not proof of
device identity. Users can check approval status before signing in.

The head-office `/users/devices` page is available only while the module is enabled, lists only
the current company, and requires `CanUpdateUsers`. An approver cannot approve their own
registration. Approval allows native sign-in while the module is enabled. Pending, revoked,
blocked, and permanently denied registrations cannot sign in while it is enabled.
An approved registration can be revoked or blocked. Revoked registrations can be approved again.
Unblocking a blocked registration returns it to **pending**, not approved. Permanent denial is
terminal for that registration. Revoke, block, and permanent denial require a reason.
Removing access revokes its refresh-token sessions; authenticated requests also recheck the
device, so existing access tokens stop working immediately while verification is enabled. A
native session is bound to its device credential for every authenticated request and refresh
while enabled. Token rotation only succeeds if
the previous token is still unrevoked, closing the concurrent revoke/refresh race. Ordinary
browser sign-in remains unchanged and does not register a device. User-account deactivation is
separate from device blocking.

On mobile startup, a saved session is restored only after authenticated policy/access checking;
an offline check fails closed. The Electron shell checks the same access policy before showing
an authenticated page and again every minute or when focused. If its access token has expired,
the desktop client performs one shared refresh and retries the policy check with the new token.
Normal web/desktop API requests share that refresh operation, so simultaneous 401 responses do
not rotate the same refresh token twice. A confirmed invalid refresh session or denied device
clears the desktop login. A network failure, 10-second request timeout, 5xx response, or malformed
policy response instead hides authenticated content and shows a Retry action without deleting
the saved login; an unavailable refresh likewise retains the login for retry. This is fail-closed
for protected content, not a bypass of device approval. Mobile keeps its existing native session
behavior. When enabled, communication WebSocket handshakes validate the device credential, and
local open sockets close when access is removed. Enabling the module closes local company sockets
so they reconnect under the new
policy. For multiple backend instances, cross-instance socket disconnection is not yet
coordinated; a remote socket closes on its next reconnect or server-side termination.
Desktop registration and status checks use the web origin actually loaded by the shell, including
when it falls back to a secondary configured origin. Cross-origin renderer requests permit the
three device headers in CORS preflight; native mobile requests do not use browser CORS. The
desktop header allow-list also covers matching `ws://`/`wss://` communication upgrades.

## Validation and failure cases

- Wrong registration credentials: 401. Non-active or companyless account: 403.
- Native sign-in without a credential, with a credential for another user/client kind, or with
  an unapproved status **while enabled**: 403. Invalid device credential on status check: 401.
- Existing native session without matching approved credential: 401 on authenticated requests;
  refresh is denied while enabled. Login and refresh never return tokens before approval when
  verification is enabled.
- `GET /v1/auth/devices/access` requires a valid access token and returns
  `{ "required": true | false }`. It succeeds without a device credential when the module is
  disabled; when enabled, the native session and credential are checked first. Invalid sessions
  receive 401. Native clients fail closed if this check fails.
- Desktop clients retry this check after a shared refresh on 401. A second 401 or a confirmed
  invalid refresh session ends access. A temporary connection/server failure blocks the screen
  with Retry and keeps local credentials; it must not be interpreted as revocation.
- Review by a user outside head office or without `CanUpdateUsers`: 403. Cross-company or
  missing device: 404. Self-approval: 403. Invalid/stale status transition: 409. Missing reason
  for revoke/block/permanent denial: 400. Review/list routes return 403 when the module is off.
- Secure storage unavailable on desktop: registration fails closed; no plaintext fallback.
- The device credential is not returned in list/review responses and must never be logged.

## Rollout and security boundary

Apply migration `0075_registered_devices.sql` **before** deploying the server and clients.
Publish the updated mobile and desktop binaries before enabling this module. Existing native
sessions issued while verification was off are not device-bound; enabling the module rejects
them and requires a new login after approval. An older app without the new
client header can still use the browser-style sign-in path. Revoke pre-rollout sessions during
the enforcement cutover and retire unsupported native versions. Keep a head-office browser
session available to approve the first native registrations after enabling; browser sign-in does
not require device approval. The backend cannot establish
that a client is truly native merely from a user-agent or header; a modified client can claim
to be a browser. Physical-device prohibition across reinstall or copied credentials requires
platform attestation or managed-device controls, which are **not** implemented. Permanent denial
stops that registration, not every possible future installation of the same physical hardware;
future requests still require explicit approval. Do not describe this as biometric verification.

## QA scenarios

1. On both native clients, register with correct credentials; verify status is pending, no
   native login succeeds, and metadata appears only in the correct company queue.
2. Approve from a different head-office user with `CanUpdateUsers`; verify login and protected
   requests work. Attempt self-approval and cross-company review; both must fail.
3. Revoke or block an active device and verify its next protected request and refresh fail
   without waiting for access-token expiry. Reapprove a revoked device; unblock a blocked one
   and verify it stays pending until approved.
4. Permanently deny a registration and verify approve/unblock fail. Attempt a new registration
   after deleting local credentials; it must still start pending, not gain automatic access.
5. Verify ordinary web-browser login remains available, and that another mobile/desktop
   installation cannot reuse a session without the matching device credential.
6. Test secure-store failure, invalid credentials, missing review reason, account deactivation,
   stale review concurrency, and logout/refresh. Confirm secrets never appear in logs or lists.
7. Configure a desktop fallback web origin, force the primary origin to fail, and verify device
   registration and status checks use the loaded fallback origin.
8. Race an active-device refresh against revocation; no newly rotated token may remain usable
   after revocation or become usable upon later reapproval.
9. From a cross-origin desktop development renderer, confirm the preflight allows the client,
   device-ID, and device-secret headers and the following authenticated request succeeds.
10. Connect the desktop communication socket, then revoke its registration. The handshake must
    carry the device credential and the local socket must close when access is removed.
11. Leave `device_verification` disabled. Verify mobile and desktop login, session restore,
    refresh, authenticated requests, and communication work without a device credential, even
    after an earlier registration was blocked. Enable it and verify those same native paths
    require an approved device; disable it again and verify new sign-ins proceed normally.
12. Enable the module while a native user has an unbound session. Protected requests and refresh
    must fail immediately, and local communication sockets must reconnect under the new policy.
13. Leave desktop idle beyond the access-token lifetime (8 hours by default), then focus it.
    Verify one refresh, a successful policy retry, and no login prompt; repeat with simultaneous
    protected API 401 responses and verify only one refresh token rotation.
14. While desktop is signed in, interrupt the network or return 503 from the policy or refresh
    endpoint. Verify protected content is hidden, Retry is available, and credentials remain.
    Restore connectivity and verify Retry succeeds without another login. Repeat with a revoked
    device or invalid refresh token and verify access remains denied and login is cleared.
