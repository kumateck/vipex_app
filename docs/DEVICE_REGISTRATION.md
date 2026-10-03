# Native Device Registration

## Current behavior

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

The head-office `/users/devices` page lists only the current company and requires
`CanUpdateUsers`. An approver cannot approve their own registration. Approval allows native
sign-in. Pending, revoked, blocked, and permanently denied registrations cannot sign in.
An approved registration can be revoked or blocked. Revoked registrations can be approved again.
Unblocking a blocked registration returns it to **pending**, not approved. Permanent denial is
terminal for that registration. Revoke, block, and permanent denial require a reason.
Removing access revokes its refresh-token sessions; authenticated requests also recheck the
device, so existing access tokens stop working immediately. A native session is bound to its
device credential for every authenticated request and refresh. Token rotation only succeeds if
the previous token is still unrevoked, closing the concurrent revoke/refresh race. Ordinary
browser sign-in remains unchanged and does not register a device. User-account deactivation is
separate from device blocking.

On mobile startup, a saved session is not restored unless the registration is still approved;
an offline status check fails closed. The Electron shell checks status before showing an
authenticated page and checks again every minute or when focused. Communication WebSocket
handshakes validate the session and device credential, and local open sockets close when access
is removed. For multiple backend instances, cross-instance socket disconnection is not yet
coordinated; a remote socket closes on its next reconnect or server-side termination.
Desktop registration and status checks use the web origin actually loaded by the shell, including
when it falls back to a secondary configured origin. Cross-origin renderer requests permit the
three device headers in CORS preflight; native mobile requests do not use browser CORS. The
desktop header allow-list also covers matching `ws://`/`wss://` communication upgrades.

## Validation and failure cases

- Wrong registration credentials: 401. Non-active or companyless account: 403.
- Native sign-in without a credential, with a credential for another user/client kind, or with
  an unapproved status: 403. Invalid device credential on status check: 401.
- Existing native session without matching approved credential: 401 on authenticated requests;
  refresh is denied. Login and refresh never return tokens before device approval.
- Review by a user outside head office or without `CanUpdateUsers`: 403. Cross-company or
  missing device: 404. Self-approval: 403. Invalid/stale status transition: 409. Missing reason
  for revoke/block/permanent denial: 400.
- Secure storage unavailable on desktop: registration fails closed; no plaintext fallback.
- The device credential is not returned in list/review responses and must never be logged.

## Rollout and security boundary

Apply migration `0075_registered_devices.sql` **before** deploying the server and clients.
Publish the updated mobile and desktop binaries before relying on this gate. Existing native
sessions issued before registration are not device-bound; updated clients reject them and require
a new login after registration. An older app without the new
client header can still use the browser-style sign-in path. Revoke pre-rollout sessions during
the enforcement cutover and retire unsupported native versions. The backend cannot establish
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
