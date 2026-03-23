# HR and Payroll Foundation

## Overview

The HR and Payroll implementation is designed as company-scoped modules that can be enabled or disabled independently.

- `hr` manages departments, job titles, employees, attendance, and employee-to-user linkage.
- `payroll` manages payroll groups, payroll cycles, payroll runs, and payslip scaffolding.
- `payroll` manages payroll groups, earning and deduction types, employee compensation, payroll cycles, payroll runs, and payslips.
- `payroll` depends on `hr`.

## Module Enablement

Company module access is controlled through:

- `module_catalog`
- `company_modules`

Backend access requires:

1. authentication
2. permission grant
3. module enabled for the company

The shared route guard is implemented in:

- `src/server/plugins/auth.ts`

Routes:

- `GET /v1/company-modules`
- `PUT /v1/company-modules/:moduleCode`

Dependency rule:

- `payroll` cannot be enabled unless `hr` is enabled.

## HR Data Model

Core tables:

- `departments`
- `job_titles`
- `employees`
- `employee_job_assignments`
- `employee_documents`
- `attendance_records`
- `leave_types`
- `leave_requests`

Important modeling decisions:

- `users` remains the authentication/access entity.
- `employees` is the HR master record.
- `users.employee_id` links a login account to an employee when needed.
- An employee can exist without a user account.
- Leave requests track manager approval separately from final HR approval.

Implemented HR routes:

- `GET /v1/hr/departments/options`
- `GET /v1/hr/departments`
- `POST /v1/hr/departments`
- `PATCH /v1/hr/departments/:id`
- `GET /v1/hr/job-titles/options`
- `GET /v1/hr/job-titles`
- `POST /v1/hr/job-titles`
- `PATCH /v1/hr/job-titles/:id`
- `GET /v1/hr/employees`
- `POST /v1/hr/employees`
- `GET /v1/hr/employees/:id`
- `PATCH /v1/hr/employees/:id`
- `POST /v1/hr/employees/:id/create-user`
- `POST /v1/hr/attendance/check-in`
- `POST /v1/hr/attendance/check-out`
- `GET /v1/hr/attendance`
- `GET /v1/hr/leave-types/options`
- `GET /v1/hr/leave-types`
- `POST /v1/hr/leave-types`
- `GET /v1/hr/leave-requests`
- `POST /v1/hr/leave-requests`
- `POST /v1/hr/leave-requests/:id/manager-approve`
- `POST /v1/hr/leave-requests/:id/manager-reject`
- `POST /v1/hr/leave-requests/:id/approve`
- `POST /v1/hr/leave-requests/:id/reject`

## Payroll Data Model

Core tables:

- `payroll_groups`
- `earning_types`
- `deduction_types`
- `employee_compensation`
- `employee_compensation_items`
- `payroll_periods`
- `payroll_overtime_entries`
- `payroll_manual_adjustments`
- `payroll_runs`
- `payroll_run_employees`
- `payroll_run_items`
- `payslips`

Important modeling decisions:

- Payroll uses separate transactional tables.
- Payroll cycles and runs are independent from live employee records.
- Payroll runs snapshot employee and compensation data into run tables before approval.
- Payslips are generated as part of the payroll run.
- Employee payment settlement data is stored on the employee record for bank export.
- Statutory deductions are generated from the compensation tax profile using active tax components.
- Approved payroll can be journalized into accounting when the accounting module is enabled and seeded.
- Overtime and manual adjustments track manager approval separately from payroll cycle approval.

Implemented payroll routes:

- `GET /v1/payroll/groups`
- `POST /v1/payroll/groups`
- `PATCH /v1/payroll/groups/:id`
- `GET /v1/payroll/earning-types`
- `POST /v1/payroll/earning-types`
- `PATCH /v1/payroll/earning-types/:id`
- `GET /v1/payroll/deduction-types`
- `POST /v1/payroll/deduction-types`
- `PATCH /v1/payroll/deduction-types/:id`
- `GET /v1/payroll/compensation`
- `GET /v1/payroll/compensation/:employeeId`
- `PUT /v1/payroll/compensation/:employeeId`
- `GET /v1/payroll/cycles`
- `POST /v1/payroll/cycles`
- `GET /v1/payroll/cycles/:id/overtime`
- `POST /v1/payroll/cycles/:id/overtime`
- `POST /v1/payroll/cycles/:id/overtime/:entryId/approve`
- `POST /v1/payroll/cycles/:id/overtime/:entryId/reject`
- `GET /v1/payroll/cycles/:id/adjustments`
- `POST /v1/payroll/cycles/:id/adjustments`
- `POST /v1/payroll/cycles/:id/adjustments/:entryId/approve`
- `POST /v1/payroll/cycles/:id/adjustments/:entryId/reject`
- `POST /v1/payroll/cycles/:id/run`
- `POST /v1/payroll/cycles/:id/approve`
- `POST /v1/payroll/cycles/:id/reopen`
- `POST /v1/payroll/cycles/:id/reverse`
- `GET /v1/payroll/cycles/:id/bank-export`
- `POST /v1/payroll/cycles/:id/journalize`
- `GET /v1/payroll/cycles/:id/payslips`
- `GET /v1/payroll/payslips/:id`

## Frontend Surfaces

Basic admin pages were added for:

- `/settings/modules`
- `/hr/departments`
- `/hr/job-titles`
- `/hr/employees`
- `/hr/attendance`
- `/hr/leave`
- `/payroll/compensation`
- `/payroll/groups`
- `/payroll/cycles`
- `/payroll/inputs`

Implemented workflow coverage:

- employee create and edit
- employee settlement capture during create and edit
- create user from employee
- attendance listing and manual check-in/check-out
- leave type setup
- leave request creation and approval
- manager approval for leave requests tied to the employee's assigned manager
- leave request audit history in the UI
- earning type setup
- deduction type setup
- employee compensation assignment
- tax profile selection during compensation setup
- compensation form prefill from the employee's current active record
- payroll cycle creation
- payroll run execution
- payslip listing per cycle
- payslip detail and printable payslip view
- bank export generation from payroll run results
- payroll journal posting into accounting
- payroll journal reversal
- payroll reopen flow for non-posted cycles
- tax-profile-driven statutory deductions during payroll run
- overtime entries per payroll cycle
- manual earning and deduction adjustments per payroll cycle
- manager approval for payroll overtime and manual adjustments tied to the employee's assigned manager
- overtime and manual adjustments included in payroll run snapshots and payslips
- attendance-adjusted base pay for daily and hourly employees during payroll run
- approved paid leave counted in daily payroll base-pay calculation
- payroll run audit history visible from the payroll cycles screen

Settlement validation rules:

- `bank` payment method requires bank name, account name, and account number
- `mobile_money` payment method requires mobile money number
- allowed payment methods are `cash`, `bank`, and `mobile_money`

Approval workflow rules:

- leave requests for employees without a manager are auto-manager-approved
- final leave approval requires manager approval first when a manager is assigned
- manager rejection closes the leave request as rejected
- payroll overtime and manual adjustments for employees without a manager are auto-approved
- payroll runs include only manager-approved overtime and manager-approved manual adjustments
- manager approval checks use the logged-in user's linked `employeeId`

Payroll accounting posting rule:

- Dr `5190 Compensation`
- Cr `2100 Accrued Expenses`

Current accounting integration notes:

- payroll journal posting requires the accounting module to be enabled for the company
- payroll journal posting requires seeded accounting chart accounts
- journal posting is only allowed after payroll approval
- reversal is only allowed after payroll journal posting
- posted payroll must be reversed before it can be reopened
- overtime and manual adjustments are blocked once a cycle is approved or posted

## Setup Notes

Apply the migration:

```bash
bun run migrate
```

Seed initial module state for an existing environment that already has users:

```bash
bun run seed:init
```

For a brand-new database with no users yet, use:

```bash
bun run seed:bootstrap
```

Default seed behavior:

- existing core operational modules are enabled
- `hr` is seeded disabled
- `payroll` is seeded disabled

## Known Gaps

The current implementation still does not include:

- advanced statutory tax and pension calculations
- bank file formats for specific banks
- payslip delivery workflow beyond generation/detail/printing
