# Documentation Coverage Audit

Audit date: 2026-08-27

## Audit Method

The audit compared:

- Web feature directories and sidebar routes.
- Server feature roots and every API module mounted under `/v1`.
- Mobile and desktop feature and package structure.
- Database schema modules and migrations through `0066_parcel_sticker_prints.sql`.
- Existing documents and in-app help guides.
- Git changes from June through August 2026.

The audit found that the repository already contained substantial March–April design and rollout documentation, but several newer operational features existed only in code or terse commit messages.

## Coverage Status

| Area                                    | Canonical document                                 | Status                                                 |
| --------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Product and runtime map                 | `APPLICATION_OVERVIEW.md`                          | Current overview added.                                |
| Full feature and API inventory          | `FEATURE_CATALOG.md`                               | Current catalog added.                                 |
| Parcels, consignments, pickup, delivery | `PARCEL_OPERATIONS.md`                             | Current workflow added.                                |
| Sticker and A5 printing                 | `PARCEL_PRINTING.md`                               | Current behavior and known gaps added.                 |
| Cashiers, shifts, and payments          | `CASHIER_PAYMENTS_AND_SHIFTS.md`                   | Current behavior and known report defect added.        |
| Self-service booking                    | `SELF_SERVICE_BOOKING.md`                          | Current workflow added.                                |
| Platform and access                     | `PLATFORM_AND_ACCESS.md`                           | Current access model added.                            |
| AI, help, and management briefs         | `AI_HELP_AND_INSIGHTS.md`                          | Current capabilities added.                            |
| Web, desktop, and mobile                | `CLIENT_APPLICATIONS.md`                           | Current client map added.                              |
| Accounting and wallet credit            | Existing module documents                          | Existing detailed coverage.                            |
| Reconciliation and transfers            | Existing module documents                          | Existing detailed coverage.                            |
| CRM and notification                    | Existing module documents                          | Existing detailed coverage.                            |
| HR and payroll                          | `HR_PAYROLL_FOUNDATION.md`                         | Foundation documented; continue feature-level updates. |
| Inventory and procurement               | Existing implementation/runbook documents          | Detailed existing coverage.                            |
| Fleet                                   | Existing module, phase, workflow, and QA documents | Detailed existing coverage.                            |
| Communication                           | Existing specification/checklist                   | Detailed existing coverage.                            |
| Reporting                               | `REPORTING_MODULE.md`                              | Existing base; new reports must be appended.           |
| Route permissions                       | `ROUTE_PERMISSION_MATRIX.md` and domain tables     | Regenerated from all 330 current route overrides.      |
| Recent release history                  | `CHANGELOG_2026-06_TO_2026-08.md`                  | Recovery changelog added.                              |

## Known Implementation-to-Documentation Mismatches

These are product gaps discovered during documentation, not documentation ambiguities:

1. Every area that prints or reprints a sticker must accept a user-entered positive whole number with no application maximum. Processed-consignment reprint currently limits selection to 20, several creation/payment paths hardcode one, and all remaining sticker call sites still require implementation verification.
2. Daily Cashier Sales can be visible to a Delivery Supervisor who cannot read cashier options; the page then treats the account as a cashier instead of allowing scoped selection.
3. Some older mobile documentation predates the migration from Expo managed workflow to bare React Native CLI and must be treated as historical where it conflicts with `apps/mobile/package.json` and `CLIENT_APPLICATIONS.md`.

## Documentation Standard Added

`AGENTS.md` now requires documentation in the same change as a feature or behavior modification. A completed implementation must document, as applicable:

- User workflow and validation.
- API and persistence changes.
- Permissions, module gates, company, and branch scope.
- Web, desktop, and mobile differences.
- Printing, integrations, background work, and settings.
- Failure, recovery, audit, and test scenarios.
- Known deviations between intended and implemented behavior.

## Remaining Maintenance Work

This audit establishes broad current coverage, but documentation remains a living product asset. Future changes should:

- Keep `API.md` synchronized with mounted routes and public contracts.
- Regenerate every domain route-permission table after route changes.
- Update in-app help when a customer- or staff-facing workflow changes.
- Convert known implementation mismatches into completed fixes and remove their mismatch notes only after verification.
- Add focused documents when an existing module grows beyond what its current overview can accurately explain.

## Definition of Documented

A feature is documented only when a reader can determine:

- Who may use it and in which scope.
- How the normal workflow behaves.
- What is validated and where authority resides.
- What data or API surface it changes.
- How failures, retries, and audit work.
- Which clients support it.
- Which important scenarios must be tested.

A commit message, issue title, screenshot, or daily log alone does not satisfy this definition.
