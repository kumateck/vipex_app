# Platform and Access Control

## Local Development Endpoints

The Vipex backend listens on `http://localhost:8080` by default. The web development server listens on `http://localhost:5173` and proxies `/v1`, `/health`, `/docs`, and `/dev` to port 8080. Set `PORT` and `VITE_BACKEND_URL` together when using a different local port.

## Access Model

Vipex combines authenticated users, roles, granular permissions, company-module gates, company scope, branch scope, and operational assignments. All layers may apply to one action.

| Layer                 | Purpose                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------- |
| Authentication        | Establishes the signed-in user and active session.                                          |
| Role                  | Groups permissions for an organizational function.                                          |
| Permission            | Authorizes a specific read, create, update, delete, approve, report, or operational action. |
| Company module        | Enables a product area for a company.                                                       |
| Company scope         | Prevents one tenant from accessing another tenant's data.                                   |
| Branch/location scope | Restricts operational data to an allowed physical scope.                                    |
| Assignment            | Adds domain eligibility, such as cashier, rider, or employee linkage.                       |

Navigation visibility is a convenience only. The server must independently authorize every protected endpoint.

## Roles and Permissions

System Administrators can manage roles and permissions. Permission managers remain bounded by their own grants, preventing them from granting capabilities they do not possess. System-Admin-only permissions cannot be delegated through an ordinary role editor.

New features must define:

- The module gate, if applicable.
- Each granular permission.
- The routes and UI controls using it.
- The company and branch scoping behavior.
- Any required domain assignment.
- Tests for denial as well as success.

The route inventory is maintained in [Route and Permission Matrix](ROUTE_PERMISSION_MATRIX.md).

## Company Modules

Company modules determine which product areas are enabled for a tenant. A disabled module should be absent from navigation and denied by the server. Module availability must not override a missing user permission.

Module administration, workspace behavior, and rollout rules are documented in [Company Modules](COMPANY_MODULES.md).

## User Lifecycle

The user lifecycle includes invitation, password setup, activation, login, forgot-password reset, authenticated password change, deactivation, and session revocation.

The web user list activates or deactivates an account with `PATCH /v1/users/:id` and a status-only body. This requires `CanUpdateUsers`. A status update changes the account status without requiring or changing cashier type, including on older cashier accounts that have no cashier type. Creating a cashier or changing a user's type to cashier requires a valid cashier type; clearing the type while the user remains a cashier returns `400`. Changing a cashier to a non-cashier type clears the cashier type. The same API behavior applies to any web, mobile, or desktop client that sends these updates.

QA scenarios: activate a legacy cashier with no cashier type using `{ "status": 0 }` and confirm the cashier type remains null; update a cashier status and confirm its existing type is preserved; try assigning cashier type without a cashier subtype and confirm `400`; change a cashier to staff and confirm its subtype is cleared.

Invitation and password-reset codes are time-bound. Passwords are validated and hashed on the server. Active authentication sessions must be revoked after security-sensitive password administration.

## System Admin Password Management

System Administrators can select an existing user and assign a new password through the dedicated password-management page.

Rules:

- The capability is reserved for the System Admin role and permission.
- A user uses Change Password for their own account instead.
- Password length is 8–128 characters and confirmation must match in the UI.
- Updating a password revokes the target user's active sessions immediately.
- The action is written to the audit log without recording the password.

## Screen Lock and Session Security

The web client can lock an idle authenticated screen and require the current password to resume. This is not a new login and does not replace server session expiration. Tokens, passwords, OTPs, and provider secrets must never appear in logs or AI context.

## Branch Operational Controls

Branch settings include independent controls for pickup OTP and receiver OTP. Both default to enabled for new or legacy-compatible branch records unless deliberately disabled. These settings change handover validation, not the user's underlying permissions.

## Platform Configuration

Administrators can configure, according to permission and module availability:

- Companies and modules.
- Branches, locations, and warehouses.
- Card types and operational reference data.
- SMS providers and balance visibility.
- Parcel ageing and storage-charge policies.
- Desktop printer routing and preferences.
- Desktop and mobile application update feeds.

Secrets must be stored server-side and masked in responses. Configuration changes require validation and audit history.

## Audit

The audit system records security and business events with actor, action, target, scope, timestamp, and relevant metadata. Sensitive values must be redacted. Audit access is itself permission-controlled.

Important events include:

- Login, failed login, logout, password reset, password administration, and session revocation.
- Role and permission changes.
- Company-module changes.
- Branch control changes.
- Payment, reconciliation, transfer, and controlled parcel actions.
- Application and provider configuration changes.

## Authorization Invariants

- Never infer a domain assignment from a role label.
- Never trust client-supplied company, branch, permission, or ownership identifiers.
- Never use hidden UI as the only protection.
- Read permissions do not imply write, approve, or administrative permissions.
- Report access does not automatically grant directory administration access.
- Cross-company access is denied even if identifiers are guessed correctly.
- A disabled module and a denied permission both produce a safe denial.

## Verification Scenarios

- Direct API request without navigation access.
- User with module enabled but permission denied, and the reverse.
- Cross-company and cross-branch identifier attempts.
- Permission manager attempting to grant an unowned or System-Admin-only permission.
- Password administration revoking active sessions and recording an audit event.
- Branch pickup and receiver OTP toggles enabled and disabled independently.
- Cashier, rider, and employee actions with and without matching assignments.
