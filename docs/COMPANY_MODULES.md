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
- [src/features/company-modules/api.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/features/company-modules/api.ts)
- [src/pages/(private)/settings/company/page.tsx](</Users/gigisiri/Business/Employment/vipex/vipex_app/src/pages/(private)/settings/company/page.tsx>)

Route:

- `/settings/company`

API:

- `GET /v1/company-modules`
- `PUT /v1/company-modules/:moduleCode`

## Access Control

Company module management requires:

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

Current rule:

- `payroll` depends on `hr`

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
