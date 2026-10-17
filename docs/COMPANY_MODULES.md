# Company Modules

## Purpose

Company modules control which optional parts of the application are available for a company.

They are used to:

- enable or disable major features by company
- keep optional modules isolated from the base operational flow
- enforce dependencies between modules
- provide a controlled head office settings screen for module access

## Current Control Points

Backend:

- [src/server/features/company-modules/routes.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/company-modules/routes.ts)
- [src/server/features/company-modules/service.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/company-modules/service.ts)
- [src/server/features/company-modules/repository.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/company-modules/repository.ts)

Frontend:

- [src/features/company-modules/pages/company-settings-page.tsx](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/company-modules/pages/company-settings-page.tsx)
- [src/features/company-modules/api/company-modules.api.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/company-modules/api/company-modules.api.ts)
- [src/shared/company-modules/route-modules.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/shared/company-modules/route-modules.ts)
- [src/pages/(private)/settings/company/page.tsx](</Users/gigisiri/Business/Employment/vipex/vipex_app/src/pages/(private)/settings/company/page.tsx>)

Route:

- `/settings/company`

API:

- `GET /v1/company-modules`
- `PUT /v1/company-modules/:moduleCode`
- `GET /v1/module-workspace/:moduleCode/overview`

## Access Control

Module listing requires:

- authenticated user

Module state updates require:

- authenticated user
- head office user
- permission `CanManageCompanyModules`

This is enforced in [routes.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/company-modules/routes.ts).

## Data Model

Tables:

- `module_catalog`
- `company_modules`

Schema:

- [src/db/schemas/company-modules.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/db/schemas/company-modules.ts)

`module_catalog` defines what modules exist globally.

`company_modules` stores:

- company
- module code
- enabled / disabled state
- timestamps
- configuring user
- optional settings payload

## Dependency Rules

Dependencies are defined in [service.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/company-modules/service.ts).

Current dependency graph includes:

- `payroll` -> `hr`
- `procurement` -> `accounting`
- `fleet_transport` -> `shipments`
- `customer_wallet_credit` -> `customers`, `payments`
- `sla_claims` -> `shipments`, `customers`
- `reconciliation` -> `payments`, `accounting`
- `document_compliance` -> `customers`
- `dispatch_optimization` -> `shipments`
- `notification_hub` -> `customers`
- `whatsapp_messaging` -> `notification_hub`
- `digital_receipts` -> `notification_hub` (its WhatsApp channel additionally needs `whatsapp_messaging` enabled and configured; this is checked at send time, not as a module dependency)
- `communication_internal` -> none
- `communication_customer_service` -> `customers`, `communication_internal`
- `communication_calls_livekit` -> `communication_internal`
- `it_support` -> none
- `bi_executive_dashboard` -> `accounting`
- `partner_agent_portal` -> `shipments`, `customers`, `payments`
- `device_verification` -> none
- `biometrics` -> `customers`

Behavior:

- enabling a module checks that required dependencies are already enabled
- disabling a module checks that no enabled module depends on it

## Accounting Integration

Accounting is now controlled through the company module system.

When the `accounting` module is enabled:

- accounting pages are available
- accounting backend routes are allowed
- accounting tax journal capture is allowed

When the `accounting` module is disabled:

- accounting pages are hidden from navigation
- direct visits to accounting pages show a disabled state
- `/v1/accounting/*` routes are blocked
- payment, parcel, cashier, delivery, and queue operations continue normally

To support auth and UI gating, the module state is synchronized into:

- `companies.use_accounting`

That sync is handled in [service.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/server/features/company-modules/service.ts) when the `accounting` module is updated.

## UI Behavior

The company settings page shows one card per module with:

- module name
- enabled / disabled badge
- core badge when applicable
- description
- last enabled / last disabled timestamps
- enable / disable action button

This UI is intentionally simple and uses action buttons instead of a switch component.

`device_verification` appears as **Device Verification** and starts disabled for each company.
Enabling it makes native mobile/desktop sign-in and sessions require an approved registration;
disabling it allows native users to proceed without that check. The Device Approvals review
page (`/settings/devices`) and review APIs are available whether it is enabled or not, so devices
can be pre-registered and approved before enablement. See [Native Device Registration](DEVICE_REGISTRATION.md)
for enforcement, client behavior, and rollout cautions.

Additionally:

- sidebar visibility is filtered by enabled module codes
- private route access is blocked when required module is disabled
- module workspace pages call module-gated backend overview endpoints

## Migrations

Relevant migrations:

- [0009_company_accounting_toggle.sql](/Users/gigisiri/Business/Employment/vipex/vipex_app/drizzle/0009_company_accounting_toggle.sql)
- [0011_sync_accounting_module_flag.sql](/Users/gigisiri/Business/Employment/vipex/vipex_app/drizzle/0011_sync_accounting_module_flag.sql)

Notes:

- `0009` adds the company accounting flag used by auth and UI gating
- `0011` syncs the existing `accounting` module state into the company flag

## Operational Notes

- Module control is company-scoped, not branch-scoped
- Module updates are audit logged
- The backend is the source of truth for module enablement
- The frontend updates the local auth store immediately for the accounting toggle so navigation and page guards react without re-login

## New Module Checklist

Every new module implementation must include:

1. Add module code to `module_catalog` seed files.
2. Add dependency rule in `src/server/features/company-modules/service.ts` (if needed).
3. Add module route mapping in `src/shared/company-modules/route-modules.ts`.
4. Gate backend routes with `requireModuleEnabled('<module_code>')` or `ensureCompanyModuleEnabledSvc`.
5. Ensure sidebar and private route access respect module enabled state.
6. Update docs in `docs/*` (API, module docs, permission matrix, rollout status).

## Communication Modules

The module catalog now includes:

- `communication_internal`
- `communication_customer_service`
- `communication_calls_livekit`
- `it_support`

Seeded in:

- [scripts/seed_initial.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/scripts/seed_initial.ts)
- [scripts/seed_bootstrap_system.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/scripts/seed_bootstrap_system.ts)

Current backend route-module enforcement:

- `/v1/communication/threads` -> `communication_internal`
- `/v1/communication/messages` -> `communication_internal`
- `/v1/communication/channels` -> `communication_internal`
- `/v1/communication/groups` -> `communication_internal`
- `/v1/communication/engagement-requests` -> `communication_internal`
- `/v1/communication/presence` -> `communication_internal`
- `/v1/communication/calls` -> `communication_calls_livekit`
- `/v1/customer-service/*` -> `communication_customer_service`
- `/v1/it-support/*` -> `it_support`

## Messaging and Receipt Modules

- `whatsapp_messaging`: WhatsApp Cloud API channel, `/settings/whatsapp` (route-module mapped), `/v1/whatsapp/*` (except `/v1/whatsapp/availability`, which reports the module state and is only auth-guarded), WhatsApp option for pickup OTPs. See [WhatsApp messaging](WHATSAPP_MESSAGING.md).
- `digital_receipts`: receipt delivery picker and `/v1/digital-receipts/*`. The public `GET /v1/public/receipts/:token` returns 404 when the module is disabled. See [Digital receipts](DIGITAL_RECEIPTS.md).

Both are off by default. Turning either off restores the previous SMS-only / print-only behaviour.

## Biometric Verification Module

- `biometrics` appears as **Biometric Verification**. It is off by default for each company and
  needs `customers` enabled first.
- **Off** means the company does not use fingerprints at all. **On** means the company may use
  them, and branch policy decides where they are required.
- **Implemented:** the catalog entry, the dependency rule, and enable/disable from
  `/settings/company` (audit logged).
- **Not implemented yet:** enabling the module currently changes no behaviour. No fingerprint
  routes, screens, or pickup checks exist yet.
- **Planned:** when fingerprint features ship, every one will be gated on this module. Disabling it
  must restore today's OTP-only pickup and unverified-sender booking. Per-branch policy
  (`otp` / `fingerprint` / `either` / `both`) will apply only while the module is enabled.
- See [Biometric verification](BIOMETRIC_VERIFICATION.md).

## Recommended Use

Use company modules for:

- optional feature packs
- staged rollouts by company
- tenant-by-tenant enablement of non-core systems

Do not use company modules for:

- row-level authorization
- branch-specific permissions
- per-user feature access

Those should remain under RBAC, branch settings, or user/role permissions.
