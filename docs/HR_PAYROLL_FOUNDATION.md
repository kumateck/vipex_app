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

Important modeling decisions:

- `users` remains the authentication/access entity.
- `employees` is the HR master record.
- `users.employee_id` links a login account to an employee when needed.
- An employee can exist without a user account.

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

## Payroll Data Model

Core tables:

- `payroll_groups`
- `earning_types`
- `deduction_types`
- `employee_compensation`
- `employee_compensation_items`
- `payroll_periods`
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
- `/payroll/compensation`
- `/payroll/groups`
- `/payroll/cycles`

Implemented workflow coverage:

- employee create and edit
- create user from employee
- earning type setup
- deduction type setup
- employee compensation assignment
- payroll cycle creation
- payroll run execution
- payslip listing per cycle
- payslip detail and printable payslip view
- bank export generation from payroll run results
- payroll journal posting into accounting
- payroll journal reversal
- payroll reopen flow for non-posted cycles
- tax-profile-driven statutory deductions during payroll run

Payroll accounting posting rule:

- Dr `5190 Compensation`
- Cr `2100 Accrued Expenses`

Current accounting integration notes:

- payroll journal posting requires the accounting module to be enabled for the company
- payroll journal posting requires seeded accounting chart accounts
- journal posting is only allowed after payroll approval
- reversal is only allowed after payroll journal posting
- posted payroll must be reversed before it can be reopened

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
- overtime, leave, and attendance-driven pay adjustments
- bank file formats for specific banks
- payslip delivery workflow beyond generation/detail/printing
