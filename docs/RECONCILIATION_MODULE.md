# Reconciliation Module

## Scope

Reconciliation v1 is implemented as a company-enabled module (`reconciliation`) with separated screens for:

- list pages
- create pages
- approvals pages

This separation is enforced in UI routes and backend permissions.

## Module Gate

- Module code: `reconciliation`
- Backend guard: `requireModuleEnabled('reconciliation')`
- Route mapping for frontend module gate:
  - `src/shared/company-modules/route-modules.ts`

If `reconciliation` is disabled for a company:

- `/reconciliation/*` routes are blocked in private layout
- reconciliation sidebar entries are hidden
- `/v1/reconciliation/*` endpoints are blocked

## Backend Endpoints

Base: `/v1/reconciliation`

### Session reconciliation

- `GET /branch-options`
- `GET /sessions`
- `POST /sessions`
- `POST /sessions/:id/approve`
- `POST /sessions/:id/finalize`

Session reconciliation is backed by existing `daily_cash_confirmations`.

### Bank settlement reconciliation

- `GET /bank-settlements`
- `POST /bank-settlements`
- `POST /bank-settlements/:id/approve`
- `POST /bank-settlements/:id/reject`

Backend files:

- `src/server/features/reconciliation/routes.ts`
- `src/server/features/reconciliation/controller.ts`
- `src/server/features/reconciliation/service.ts`
- `src/server/features/reconciliation/repository.ts`

## Data Model

New table:

- `reconciliation_bank_settlements`

Schema file:

- `src/db/schemas/reconciliation.ts`

Also reads:

- `daily_cash_confirmations` (session reconciliation source)

## UI Routes (Separated)

- `/reconciliation` (home launcher)
- `/reconciliation/sessions` (session list)
- `/reconciliation/sessions/new` (session create)
- `/reconciliation/sessions/approvals` (session approvals)
- `/reconciliation/bank-settlements` (settlement list)
- `/reconciliation/bank-settlements/new` (settlement create)
- `/reconciliation/bank-settlements/approvals` (settlement approvals)

Frontend files:

- `src/features/reconciliation/api/reconciliation.api.ts`
- `src/features/reconciliation/pages/reconciliation-home-page.tsx`
- `src/features/reconciliation/pages/reconciliation-sessions-list-page.tsx`
- `src/features/reconciliation/pages/reconciliation-sessions-create-page.tsx`
- `src/features/reconciliation/pages/reconciliation-sessions-approvals-page.tsx`
- `src/features/reconciliation/pages/reconciliation-bank-settlements-list-page.tsx`
- `src/features/reconciliation/pages/reconciliation-bank-settlements-create-page.tsx`
- `src/features/reconciliation/pages/reconciliation-bank-settlements-approvals-page.tsx`

## Permissions

Reconciliation actions are role-gated with dedicated keys:

- `CanReadReconciliation`
- `CanCreateReconciliationSessions`
- `CanApproveReconciliationSessions`
- `CanCreateReconciliationBankSettlements`
- `CanApproveReconciliationBankSettlements`

Mapped routes are listed in:

- `docs/ROUTE_PERMISSION_MATRIX.md`

## Notes

- Session approvals are separated:
  - `Approve` confirms the daily cash confirmation.
  - `Finalize` posts the confirmed entry.
- Settlement approvals are separated from settlement creation and support explicit rejection reason.
