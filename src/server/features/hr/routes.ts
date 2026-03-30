import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { NonEmpty255, PaginationRequestQueryProps, UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { BranchType } from '@/db/schemas/enums';
import {
  approveLeaveRequestCtrl,
  approveLeaveRequestByManagerCtrl,
  checkInAttendanceCtrl,
  checkOutAttendanceCtrl,
  createDepartmentCtrl,
  createEmployeeCtrl,
  createEmployeeUserAccountCtrl,
  createJobTitleCtrl,
  createLeaveRequestCtrl,
  createLeaveTypeCtrl,
  getEmployeeCtrl,
  listDepartmentOptionsCtrl,
  listDepartmentsCtrl,
  listAttendanceCtrl,
  listEmployeesCtrl,
  listJobTitleOptionsCtrl,
  listJobTitlesCtrl,
  listLeaveRequestsCtrl,
  listLeaveTypeOptionsCtrl,
  listLeaveTypesCtrl,
  rejectLeaveRequestCtrl,
  rejectLeaveRequestByManagerCtrl,
  updateDepartmentCtrl,
  updateEmployeeCtrl,
  updateJobTitleCtrl,
} from './controller';

export const hrRoutes = new Elysia({ name: 'hr' })
  .use(authPlugin)
  .get(
    '/departments/options',
    async ({ query, user }) =>
      listDepartmentOptionsCtrl((user as AuthUser).companyId!, query.search ?? null),
    {
      query: t.Object({ search: t.Optional(t.String()) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadDepartments),
        requireModuleEnabled('hr'),
      ],
      detail: {
        tags: ['HR'],
        summary: 'List department options',
        operationId: 'listDepartmentOptions',
      },
    },
  )
  .get(
    '/departments',
    async ({ query, user }) =>
      listDepartmentsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          includeInactive: query.includeInactive ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        includeInactive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadDepartments),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'List departments', operationId: 'listDepartments' },
    },
  )
  .post(
    '/departments',
    async ({ body, set, user }) => {
      const result = await createDepartmentCtrl({
        companyId: (user as AuthUser).companyId!,
        code: body.code ?? null,
        name: body.name,
        description: body.description ?? null,
        createdBy: (user as AuthUser).sub,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        code: t.Optional(t.Union([t.String({ maxLength: 50 }), t.Null()])),
        name: NonEmpty255,
        description: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateDepartments),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'Create department', operationId: 'createDepartment' },
    },
  )
  .patch(
    '/departments/:id',
    async ({ params, body, user }) =>
      updateDepartmentCtrl(params.id, (user as AuthUser).companyId!, {
        code: body.code,
        name: body.name,
        description: body.description,
        isActive: body.isActive,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        code: t.Optional(t.Union([t.String({ maxLength: 50 }), t.Null()])),
        name: t.Optional(NonEmpty255),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateDepartments),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'Update department', operationId: 'updateDepartment' },
    },
  )
  .get(
    '/job-titles/options',
    async ({ query, user }) =>
      listJobTitleOptionsCtrl((user as AuthUser).companyId!, query.search ?? null),
    {
      query: t.Object({ search: t.Optional(t.String()) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadJobTitles),
        requireModuleEnabled('hr'),
      ],
      detail: {
        tags: ['HR'],
        summary: 'List job title options',
        operationId: 'listJobTitleOptions',
      },
    },
  )
  .get(
    '/job-titles',
    async ({ query, user }) =>
      listJobTitlesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          includeInactive: query.includeInactive ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        includeInactive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadJobTitles),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'List job titles', operationId: 'listJobTitles' },
    },
  )
  .post(
    '/job-titles',
    async ({ body, set, user }) => {
      const result = await createJobTitleCtrl({
        companyId: (user as AuthUser).companyId!,
        departmentId: body.departmentId ?? null,
        code: body.code ?? null,
        name: body.name,
        description: body.description ?? null,
        createdBy: (user as AuthUser).sub,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        departmentId: t.Optional(t.Union([UUID, t.Null()])),
        code: t.Optional(t.Union([t.String({ maxLength: 50 }), t.Null()])),
        name: NonEmpty255,
        description: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateJobTitles),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'Create job title', operationId: 'createJobTitle' },
    },
  )
  .patch(
    '/job-titles/:id',
    async ({ params, body, user }) =>
      updateJobTitleCtrl(params.id, (user as AuthUser).companyId!, {
        departmentId: body.departmentId,
        code: body.code,
        name: body.name,
        description: body.description,
        isActive: body.isActive,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        departmentId: t.Optional(t.Union([UUID, t.Null()])),
        code: t.Optional(t.Union([t.String({ maxLength: 50 }), t.Null()])),
        name: t.Optional(NonEmpty255),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateJobTitles),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'Update job title', operationId: 'updateJobTitle' },
    },
  )
  .get(
    '/leave-types/options',
    async ({ user }) => listLeaveTypeOptionsCtrl((user as AuthUser).companyId!),
    {
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadLeaveTypes),
        requireModuleEnabled('hr'),
      ],
      detail: {
        tags: ['HR'],
        summary: 'List leave type options',
        operationId: 'listLeaveTypeOptions',
      },
    },
  )
  .get(
    '/leave-types',
    async ({ query, user }) =>
      listLeaveTypesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          includeInactive: query.includeInactive ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        includeInactive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadLeaveTypes),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'List leave types', operationId: 'listLeaveTypes' },
    },
  )
  .post(
    '/leave-types',
    async ({ body, set, user }) => {
      const result = await createLeaveTypeCtrl({
        companyId: (user as AuthUser).companyId!,
        code: body.code ?? null,
        name: body.name,
        isPaid: body.isPaid ?? true,
        createdBy: (user as AuthUser).sub,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        code: t.Optional(t.Union([t.String({ maxLength: 50 }), t.Null()])),
        name: NonEmpty255,
        isPaid: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateLeaveTypes),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'Create leave type', operationId: 'createLeaveType' },
    },
  )
  .get(
    '/employees',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      const isHeadOffice = authUser.branchType === BranchType.HEADOFFICE;
      return listEmployeesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: authUser.companyId!,
          branchId: isHeadOffice ? (query.branchId ?? null) : (authUser.branchId ?? null),
          departmentId: query.departmentId ?? null,
          jobTitleId: query.jobTitleId ?? null,
          officerEmployeeId: query.officerEmployeeId ?? null,
          status: query.status ?? null,
        },
      });
    },
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        branchId: t.Optional(UUID),
        departmentId: t.Optional(UUID),
        jobTitleId: t.Optional(UUID),
        officerEmployeeId: t.Optional(UUID),
        status: t.Optional(t.Number()),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanListEmployees),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'List employees', operationId: 'listEmployees' },
    },
  )
  .post(
    '/employees',
    async ({ body, set, user }) => {
      const authUser = user as AuthUser;
      const result = await createEmployeeCtrl({
        companyId: authUser.companyId!,
        employeeNumber: body.employeeNumber,
        firstName: body.firstName,
        middleName: body.middleName ?? null,
        lastName: body.lastName,
        email: body.email ?? null,
        profileImageUrl: body.profileImageUrl ?? null,
        telephone: body.telephone,
        paymentMethod: body.paymentMethod ?? null,
        bankName: body.bankName ?? null,
        bankAccountName: body.bankAccountName ?? null,
        bankAccountNumber: body.bankAccountNumber ?? null,
        mobileMoneyNumber: body.mobileMoneyNumber ?? null,
        branchId: body.branchId ?? null,
        locationId: body.locationId ?? null,
        departmentId: body.departmentId ?? null,
        jobTitleId: body.jobTitleId ?? null,
        reportingOfficerTitleId: body.reportingOfficerTitleId ?? null,
        officerEmployeeId: body.officerEmployeeId ?? null,
        supervisorEmployeeId: body.supervisorEmployeeId ?? null,
        employmentStatus: body.employmentStatus ?? undefined,
        employmentType: body.employmentType ?? undefined,
        hireDate: new Date(body.hireDate),
        createdBy: authUser.sub,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        employeeNumber: NonEmpty255,
        firstName: NonEmpty255,
        middleName: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        lastName: NonEmpty255,
        email: t.Optional(t.String({ format: 'email' })),
        profileImageUrl: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
        telephone: t.String({ minLength: 7, maxLength: 20 }),
        paymentMethod: t.Optional(t.Union([t.String({ maxLength: 30 }), t.Null()])),
        bankName: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        bankAccountName: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        bankAccountNumber: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        mobileMoneyNumber: t.Optional(t.Union([t.String({ maxLength: 30 }), t.Null()])),
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        locationId: t.Optional(t.Union([UUID, t.Null()])),
        departmentId: t.Optional(t.Union([UUID, t.Null()])),
        jobTitleId: t.Optional(t.Union([UUID, t.Null()])),
        reportingOfficerTitleId: t.Optional(t.Union([UUID, t.Null()])),
        officerEmployeeId: t.Optional(t.Union([UUID, t.Null()])),
        supervisorEmployeeId: t.Optional(t.Union([UUID, t.Null()])),
        hireDate: t.String({ format: 'date' }),
        employmentStatus: t.Optional(t.Number()),
        employmentType: t.Optional(t.Number()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateEmployee),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'Create employee', operationId: 'createEmployee' },
    },
  )
  .get('/employees/:id', async ({ params }) => getEmployeeCtrl(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [
      requireAuth(),
      requirePermissions(PermissionKeys.CanGetEmployee),
      requireModuleEnabled('hr'),
    ],
    detail: { tags: ['HR'], summary: 'Get employee', operationId: 'getEmployee' },
  })
  .patch(
    '/employees/:id',
    async ({ params, body, user }) => {
      return updateEmployeeCtrl(
        params.id,
        {
          firstName: body.firstName,
          middleName: body.middleName,
          lastName: body.lastName,
          email: body.email,
          profileImageUrl: body.profileImageUrl,
          telephone: body.telephone,
          paymentMethod: body.paymentMethod,
          bankName: body.bankName,
          bankAccountName: body.bankAccountName,
          bankAccountNumber: body.bankAccountNumber,
          mobileMoneyNumber: body.mobileMoneyNumber,
          branchId: body.branchId,
          locationId: body.locationId,
          departmentId: body.departmentId,
          jobTitleId: body.jobTitleId,
          reportingOfficerTitleId: body.reportingOfficerTitleId,
          officerEmployeeId: body.officerEmployeeId,
          supervisorEmployeeId: body.supervisorEmployeeId,
          employmentStatus: body.employmentStatus,
          employmentType: body.employmentType,
          confirmationDate: body.confirmationDate ? new Date(body.confirmationDate) : undefined,
          terminationDate: body.terminationDate ? new Date(body.terminationDate) : undefined,
          terminationReason: body.terminationReason,
        },
        (user as AuthUser).sub,
      );
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        firstName: t.Optional(NonEmpty255),
        middleName: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        lastName: t.Optional(NonEmpty255),
        email: t.Optional(t.Union([t.String({ format: 'email' }), t.Null()])),
        profileImageUrl: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
        telephone: t.Optional(t.String({ minLength: 7, maxLength: 20 })),
        paymentMethod: t.Optional(t.Union([t.String({ maxLength: 30 }), t.Null()])),
        bankName: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        bankAccountName: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        bankAccountNumber: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        mobileMoneyNumber: t.Optional(t.Union([t.String({ maxLength: 30 }), t.Null()])),
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        locationId: t.Optional(t.Union([UUID, t.Null()])),
        departmentId: t.Optional(t.Union([UUID, t.Null()])),
        jobTitleId: t.Optional(t.Union([UUID, t.Null()])),
        reportingOfficerTitleId: t.Optional(t.Union([UUID, t.Null()])),
        officerEmployeeId: t.Optional(t.Union([UUID, t.Null()])),
        supervisorEmployeeId: t.Optional(t.Union([UUID, t.Null()])),
        employmentStatus: t.Optional(t.Number()),
        employmentType: t.Optional(t.Number()),
        confirmationDate: t.Optional(t.Union([t.String({ format: 'date' }), t.Null()])),
        terminationDate: t.Optional(t.Union([t.String({ format: 'date' }), t.Null()])),
        terminationReason: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateEmployee),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'Update employee', operationId: 'updateEmployee' },
    },
  )
  .post(
    '/employees/:id/create-user',
    async ({ params, body, user, set }) => {
      const authUser = user as AuthUser;
      const result = await createEmployeeUserAccountCtrl({
        employeeId: params.id,
        roleId: body.roleId,
        branchId: body.branchId,
        locationId: body.locationId ?? null,
        createdBy: authUser.sub,
        actor: {
          companyId: authUser.companyId ?? null,
          branchId: authUser.branchId ?? null,
          branchType: authUser.branchType ?? null,
          locationId: authUser.locationId ?? null,
        },
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        roleId: UUID,
        branchId: UUID,
        locationId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateEmployeeUserAccount),
        requireModuleEnabled('hr'),
      ],
      detail: {
        tags: ['HR'],
        summary: 'Create a user account from an employee',
        operationId: 'createEmployeeUserAccount',
      },
    },
  )
  .post(
    '/attendance/check-in',
    async ({ body, user }) => {
      return checkInAttendanceCtrl({
        companyId: (user as AuthUser).companyId!,
        employeeId: body.employeeId,
        branchId: body.branchId ?? null,
        locationId: body.locationId ?? null,
        checkedInAt: body.checkedInAt ? new Date(body.checkedInAt) : undefined,
      });
    },
    {
      body: t.Object({
        employeeId: UUID,
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        locationId: t.Optional(t.Union([UUID, t.Null()])),
        checkedInAt: t.Optional(t.String({ format: 'date-time' })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCheckInAttendance),
        requireModuleEnabled('hr'),
      ],
      detail: {
        tags: ['HR'],
        summary: 'Employee attendance check-in',
        operationId: 'checkInAttendance',
      },
    },
  )
  .post(
    '/attendance/check-out',
    async ({ body }) => {
      return checkOutAttendanceCtrl({
        employeeId: body.employeeId,
        checkedOutAt: body.checkedOutAt ? new Date(body.checkedOutAt) : undefined,
      });
    },
    {
      body: t.Object({
        employeeId: UUID,
        checkedOutAt: t.Optional(t.String({ format: 'date-time' })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCheckOutAttendance),
        requireModuleEnabled('hr'),
      ],
      detail: {
        tags: ['HR'],
        summary: 'Employee attendance check-out',
        operationId: 'checkOutAttendance',
      },
    },
  )
  .get(
    '/leave-requests',
    async ({ query, user }) =>
      listLeaveRequestsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          employeeId: query.employeeId ?? null,
          status: query.status ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        employeeId: t.Optional(UUID),
        status: t.Optional(t.Number()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanListLeaveRequests),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'List leave requests', operationId: 'listLeaveRequests' },
    },
  )
  .post(
    '/leave-requests',
    async ({ body, set, user }) => {
      const result = await createLeaveRequestCtrl({
        companyId: (user as AuthUser).companyId!,
        employeeId: body.employeeId,
        leaveTypeId: body.leaveTypeId,
        dateFrom: new Date(body.dateFrom),
        dateTo: new Date(body.dateTo),
        reason: body.reason ?? null,
        createdBy: (user as AuthUser).sub,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        employeeId: UUID,
        leaveTypeId: UUID,
        dateFrom: t.String({ format: 'date' }),
        dateTo: t.String({ format: 'date' }),
        reason: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateLeaveRequest),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'Create leave request', operationId: 'createLeaveRequest' },
    },
  )
  .post(
    '/leave-requests/:id/manager-approve',
    async ({ params, user }) => approveLeaveRequestByManagerCtrl(params.id, (user as AuthUser).sub),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveManagedLeaveRequests),
        requireModuleEnabled('hr'),
      ],
      detail: {
        tags: ['HR'],
        summary: 'Manager approve leave request',
        operationId: 'approveLeaveRequestByManager',
      },
    },
  )
  .post(
    '/leave-requests/:id/manager-reject',
    async ({ params, body, user }) =>
      rejectLeaveRequestByManagerCtrl(params.id, (user as AuthUser).sub, body.reason ?? null),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ reason: t.Optional(t.Union([t.String(), t.Null()])) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveManagedLeaveRequests),
        requireModuleEnabled('hr'),
      ],
      detail: {
        tags: ['HR'],
        summary: 'Manager reject leave request',
        operationId: 'rejectLeaveRequestByManager',
      },
    },
  )
  .post(
    '/leave-requests/:id/approve',
    async ({ params, user }) => approveLeaveRequestCtrl(params.id, (user as AuthUser).sub),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveLeaveRequest),
        requireModuleEnabled('hr'),
      ],
      detail: {
        tags: ['HR'],
        summary: 'Approve leave request',
        operationId: 'approveLeaveRequest',
      },
    },
  )
  .post(
    '/leave-requests/:id/reject',
    async ({ params, body, user }) =>
      rejectLeaveRequestCtrl(params.id, (user as AuthUser).sub, body.reason ?? null),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ reason: t.Optional(t.Union([t.String(), t.Null()])) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveLeaveRequest),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'Reject leave request', operationId: 'rejectLeaveRequest' },
    },
  )
  .get(
    '/attendance',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      const isHeadOffice = authUser.branchType === BranchType.HEADOFFICE;
      return listAttendanceCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: authUser.companyId!,
          employeeId: query.employeeId ?? null,
          branchId: isHeadOffice ? (query.branchId ?? null) : (authUser.branchId ?? null),
          from: new Date(query.from),
          to: new Date(query.to),
        },
      });
    },
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        employeeId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        from: t.String({ format: 'date' }),
        to: t.String({ format: 'date' }),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanListAttendance),
        requireModuleEnabled('hr'),
      ],
      detail: { tags: ['HR'], summary: 'Attendance report', operationId: 'listAttendance' },
    },
  );
