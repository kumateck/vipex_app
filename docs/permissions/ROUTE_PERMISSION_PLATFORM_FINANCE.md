# Route Permissions: Platform and Finance

Generated from `src/shared/permissions/constants.ts` (`RoutePermissionOverrides`) on 2026-08-27.

Platform, user, dashboard, accounting, and other core route overrides.

| Route                              | Permission key                      |
| ---------------------------------- | ----------------------------------- |
| `/users/password-management`       | `CanSetUserPassword`                |
| `/accounting/daily-cash`           | `CanCreateDailyCashConfirmation`    |
| `/accounting/daily-cash/drafts`    | `CanConfirmDailyCashConfirmation`   |
| `/accounting/daily-cash/approvals` | `CanConfirmDailyCashConfirmation`   |
| `/accounting/daily-cash/recorded`  | `CanPostDailyCashConfirmation`      |
| `/accounting/expenses`             | `CanCreateExpenseRequest`           |
| `/accounting/expenses/drafts`      | `CanSubmitExpenseRequest`           |
| `/accounting/expenses/approvals`   | `CanApproveExpenseRequest`          |
| `/accounting/expenses/payments`    | `CanPayExpenseRequest`              |
| `/accounting/expenses/posting`     | `CanPostExpenseRequest`             |
| `/accounting/expenses/history`     | `CanReadAccounting`                 |
| `/accounting/reports`              | `CanReadAccounting`                 |
| `/accounting/tax`                  | `CanCreateTaxFilingPeriod`          |
| `/accounting/journal-entries`      | `CanReadAccountingManualEntries`    |
| `/accounting/journal-approvals`    | `CanApproveAccountingManualEntries` |
| `/settings/company`                | `CanReadCompanyProfile`             |
| `/settings/sms`                    | `CanReadCompanyProfile`             |
| `/settings/modules`                | `CanManageCompanyModules`           |
| `/settings/parcel-ageing`          | `CanManageParcelAgeingPolicy`       |
| `/settings/app-updates`            | `CanManageDesktopUpdates`           |
| `/settings/printer-routing`        | `CanManagePrinterRouting`           |
| `/settings/appearance`             | `CanManageAppearance`               |
| `/dashboard`                       | `CanReadDashboard`                  |
| `/dashboard/accountant`            | `CanReadDashboard`                  |
| `/dashboard/admin`                 | `CanReadDashboard`                  |
| `/dashboard/auditor`               | `CanReadDashboard`                  |
| `/dashboard/cashier`               | `CanReadDashboard`                  |
| `/dashboard/ceo`                   | `CanReadDashboard`                  |
| `/dashboard/hr-manager`            | `CanReadDashboard`                  |
| `/dashboard/it`                    | `CanReadDashboard`                  |
| `/dashboard/secretary`             | `CanReadDashboard`                  |
| `/bi-executive-dashboard`          | `CanReadReportsHub`                 |
| `/ai-chat`                         | `CanUseAIChat`                      |
| `/analytics`                       | `CanReadDashboard`                  |
| `/users/active`                    | `CanReadActiveUsers`                |
| `/users/inactive`                  | `CanReadInactiveUsers`              |
| `/users/invites`                   | `CanResendSetupInvite`              |
