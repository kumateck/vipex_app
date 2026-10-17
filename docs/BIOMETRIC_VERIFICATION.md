# Biometric (Fingerprint) Verification

> **Status: Planned — mostly not implemented.** The only part that exists is the `biometrics`
> company module, which head office can enable or disable (see [Company Module Gate](#company-module-gate)).
> Everything else records the agreed design so procurement and implementation share one source of
> truth. Update each section to describe current behavior as phases ship, and mark any mismatch
> explicitly.

## Company Module Gate

| Item           | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| Module code    | `biometrics` (**Biometric Verification**) in `src/shared/company-modules/catalog.ts`      |
| Default        | Disabled for every company                                                                |
| Dependency     | `customers` must be enabled first (`MODULE_DEPENDENCIES` in `company-modules/service.ts`) |
| Managed at     | `/settings/company` by head office users with `CanManageCompanyModules`                   |
| Current effect | **None yet.** Enabling or disabling only records the module state and an audit entry      |

**Meaning of the switch:**

- **Off:** the company does not use fingerprints. No capture, enrollment, or verification anywhere.
  Booking and pickup behave exactly as they do today.
- **On:** the company may use fingerprints. Each branch's verification policy then decides where a
  fingerprint is optional or required.

Planned rules for later phases:

- Every biometric route will use `requireModuleEnabled('biometrics')` or `ensureCompanyModuleEnabledSvc`.
- Every biometric screen and dialog will be hidden while the module is disabled.
- While the module is disabled, branch verification modes are ignored and OTP-only behavior applies.
- Disabling the module **does not delete** enrolled templates. Deleting them is a separate revoke
  action, so turning the module back on does not force customers to enroll again.

## Purpose

Verify the **sender** and the **receiver** of a parcel with a fingerprint, captured on counter POS
PCs that have a built-in sensor. The fingerprint check adds to or replaces the receiver OTP. It also
gives the parcel history evidence that holds up in a dispute.

## Current Baseline (implemented today)

| Party                  | Current check                                                                                                         | Reference                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Sender at drop-off     | None beyond customer lookup by phone                                                                                  | [Parcel operations](PARCEL_OPERATIONS.md)                   |
| Receiver office pickup | SMS/WhatsApp OTP enforced server-side by branch `requirePickupOtp` / `requireReceiverOtp`; ID card optional and typed | [Parcel operations — Receiver OTP](PARCEL_OPERATIONS.md)    |
| Rider doorstep         | Signature image only                                                                                                  | [Mobile frontline workflows](MOBILE_FRONTLINE_WORKFLOWS.md) |
| Staff approvals        | Password session and RBAC permission only                                                                             | [Platform and access control](PLATFORM_AND_ACCESS.md)       |

## Planned Touchpoints

| #   | Touchpoint                                   | Who scans                        | Purpose code              | Phase |
| --- | -------------------------------------------- | -------------------------------- | ------------------------- | ----- |
| 1   | Counter booking (parcel create)              | Sender                           | `sender_dropoff`          | 2     |
| 2   | Self-service draft completion at staff PC    | Sender                           | `sender_dropoff`          | 2     |
| 3   | Waiting for Pickup / Receiver Cashier        | Main or second receiver          | `receiver_pickup`         | 2     |
| 4   | Return to sender                             | Original sender                  | `return_to_sender`        | 3     |
| 5   | Receiver change, second receiver, phone edit | Sender / customer                | `customer_sensitive_edit` | 3     |
| 6   | Reversal, reconciliation, override, shift    | Supervisor / cashier             | `staff_approval`          | 3     |
| 7   | Rider doorstep delivery                      | Receiver (mobile sensor)         | `receiver_doorstep`       | 4     |
| 8   | Parcel history / CS tickets                  | — (displays verification events) | —                         | 2     |

## Hardware Procurement Checklist (Phase 0 gate)

Many all-in-one POS fingerprint sensors work only with **Windows Hello (WBF)**. That kind of sensor
cannot export a template, so it **cannot be used to match customers**. Before any bulk order, the
vendor must confirm all of the following in writing, and one sample unit must pass the Phase 0 spike:

- [ ] Windows 10/11 x64. The Electron shell ships as a Windows build.
- [ ] A vendor SDK with a C or .NET API, licensed for redistribution inside our Electron app.
- [ ] Template export in **ISO/IEC 19794-2** or **ANSI INCITS 378**. Raw image export is optional.
- [ ] Live-finger (anti-spoof) detection and a per-capture quality score.
- [ ] 500 dpi sensor, around FBI FAP 10 or higher.
- [ ] Matching licence terms: is matching per device, and are templates allowed to be matched on a server?
- [ ] The same template format is available on the Android devices planned for riders (Phase 4).

## Planned Architecture

**Capture on the device, match on the server.** The client never decides that a match succeeded.

1. **Desktop (Electron):** a main-process `biometrics` module wraps the vendor SDK. The preload
   bridge exposes `window.api.biometrics.status()`, `capture({ purpose })` and `cancel()`. A
   capture returns the template, a quality score and a liveness flag. Images never reach the web
   layer. Only registered devices may use it (see [Device registration](DEVICE_REGISTRATION.md)).
2. **Web:** `src/features/biometrics/` contains the bridge service, capture/verify/enroll hooks, the
   enroll and verify dialogs, and a status badge. A browser, or a device without a sensor, falls
   back to the OTP flow.
3. **Server:** `src/server/features/biometrics/` does a 1:1 match against the claimed subject's
   enrolled templates. A successful match issues a **single-use verification token** bound to the
   purpose and the parcel, following the receiver OTP token pattern. The matcher sits behind an
   interface. The default candidate is a SourceAFIS sidecar.

### Planned Endpoints

| Method | Path                                  | Purpose                                                    |
| ------ | ------------------------------------- | ---------------------------------------------------------- |
| POST   | `/v1/biometrics/enroll`               | Enroll customer or staff fingers (consent required)        |
| POST   | `/v1/biometrics/verify`               | 1:1 match; returns `{ matched, score, verificationToken }` |
| GET    | `/v1/biometrics/customers/:id/status` | Enrollment status (no template data)                       |
| DELETE | `/v1/biometrics/customers/:id`        | Revoke and delete templates                                |

Office pickup and receiver-cashier delivery will accept **either** a receiver OTP token **or** a
`receiver_pickup` biometric token, depending on branch policy.

### Planned Data

- `customer_biometric_templates` and `staff_biometric_templates` store the finger index, format,
  the **AES-GCM encrypted template** (the key is held outside the database), quality, consent
  version and timestamp, who enrolled it, the device and the status.
- `biometric_verifications` stores the purpose, subject, parcel, result, score, device, operator,
  token hash, expiry and when the token was used. Every row is also written to the audit log.
- Parcels get a `senderVerificationId`. The receiver verification method is recorded in
  `deliveryConfirmationSnapshot`.
- Branch policy will have `pickupVerificationMode` and `senderVerificationMode`, each one of `otp` |
  `fingerprint` | `either` | `both`. The default `otp` keeps today's behavior.
- Module gate: `biometrics`. Permissions: `CanEnrollCustomerBiometrics`,
  `CanRevokeCustomerBiometrics`, `CanOverrideBiometricVerification`.

## Planned Fallback Rules

1. The subject is not enrolled, or 3 captures fail on quality or match: send an OTP to the
   customer's phone **and** require an ID card type and number (compared with `customer_cards`
   when one is on file).
2. After a successful fallback, offer enrollment straight away.
3. If an OTP is not possible either, a supervisor with `CanOverrideBiometricVerification`
   approves with their own fingerprint and a mandatory reason. This is audited.

## Privacy and Compliance

Fingerprints are special personal data under Ghana's Data Protection Act, 2012 (Act 843).
Requirements:

- Explicit, versioned consent captured before enrollment
- A stated purpose and retention period
- Registration with the Data Protection Commission
- Deletion when the customer asks
- Templates only; images are never stored
- Templates encrypted at rest and never returned by any API

Linking the existing `isNiaVerified` flag to Ghana Card (NIA) fingerprint verification is out of
scope for now.

## Rollout Phases

| Phase | Scope                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------ |
| 0     | Hardware spike on a sample POS: capture, export template, server match; choose the matcher                   |
| 1     | Schema, enroll/verify/revoke API, desktop bridge, customer-profile enrollment, consent, permissions          |
| 2     | Sender check at booking and self-service completion; receiver check at pickup and cashier; fallback; history |
| 3     | Return to sender, receiver/phone changes, staff step-up approvals, optional fingerprint login                |
| 4     | Rider mobile device with sensor, doorstep fingerprint plus OTP fallback                                      |

## Test Scenarios (to automate as phases ship)

- Same finger matches above the threshold. A different finger or a fake finger is rejected.
- Verification token is single use. An expired, reused, wrong-purpose or wrong-parcel token is rejected.
- Office pickup is enforced correctly under each `pickupVerificationMode`.
- With every branch on `otp`, booking, pickup and cashier behavior is unchanged (regression).
- Fallback (OTP + ID) completes delivery and offers enrollment.
- Override requires the permission and a reason, and writes an audit entry.
- Templates are encrypted at rest and no endpoint returns them.
- A browser without the desktop bridge shows the OTP fallback instead of a capture prompt.

## Open Decisions

- POS model and SDK, pending vendor answers to the checklist above.
- Matcher: SourceAFIS sidecar (recommended) or the vendor's server matcher.
- Whether the sender fingerprint is optional at launch (recommended for about one month) before
  branches make it required.
