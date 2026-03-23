import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export interface Department {
  id: string;
  companyId: string;
  code?: string | null;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface JobTitle {
  id: string;
  companyId: string;
  code?: string | null;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Employee {
  id: string;
  companyId: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  displayName: string;
  email?: string | null;
  telephone: string;
  paymentMethod?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  mobileMoneyNumber?: string | null;
  employmentStatus: number;
  employmentType: number;
  hireDate?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  jobTitleId?: string | null;
  jobTitleName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  managerEmployeeId?: string | null;
  alternatePhone?: string | null;
  confirmationDate?: string | null;
  terminationDate?: string | null;
  terminationReason?: string | null;
  hasUserAccount: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  attendanceDate: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  minutesWorked?: number | null;
  status: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LeaveType {
  id: string;
  companyId: string;
  code?: string | null;
  name: string;
  isPaid: boolean;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName?: string | null;
  managerEmployeeId?: string | null;
  leaveTypeId: string;
  leaveTypeName?: string | null;
  leaveTypeIsPaid?: boolean;
  dateFrom: string;
  dateTo: string;
  daysCount: number;
  reason?: string | null;
  managerApprovalStatus: number;
  managerApprovedBy?: string | null;
  managerApprovedAt?: string | null;
  managerRejectionReason?: string | null;
  status: number;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export const hrApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listDepartments: builder.query<
      ServerListResponse<Department>,
      ServerListQuery<{ includeInactive?: boolean | null }> | void
    >({
      query: (query) => ({
        url: '/hr/departments',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('HR', result),
    }),
    listDepartmentOptions: builder.query<Department[], { search?: string } | void>({
      query: (params) => ({
        url: '/hr/departments/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'HR', id: 'DEPARTMENT_OPTIONS' }],
    }),
    createDepartment: builder.mutation<
      { id?: string },
      { code?: string | null; name: string; description?: string | null }
    >({
      query: (body) => ({
        url: '/hr/departments',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('HR'),
    }),
    updateDepartment: builder.mutation<
      { id?: string },
      {
        id: string;
        body: {
          code?: string | null;
          name?: string;
          description?: string | null;
          isActive?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/hr/departments/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('HR'),
    }),
    listJobTitles: builder.query<
      ServerListResponse<JobTitle>,
      ServerListQuery<{ includeInactive?: boolean | null }> | void
    >({
      query: (query) => ({
        url: '/hr/job-titles',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('HR', result),
    }),
    listJobTitleOptions: builder.query<JobTitle[], { search?: string } | void>({
      query: (params) => ({
        url: '/hr/job-titles/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'HR', id: 'JOB_TITLE_OPTIONS' }],
    }),
    createJobTitle: builder.mutation<
      { id?: string },
      { code?: string | null; name: string; description?: string | null }
    >({
      query: (body) => ({
        url: '/hr/job-titles',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('HR'),
    }),
    updateJobTitle: builder.mutation<
      { id?: string },
      {
        id: string;
        body: {
          code?: string | null;
          name?: string;
          description?: string | null;
          isActive?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/hr/job-titles/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('HR'),
    }),
    listEmployees: builder.query<
      ServerListResponse<Employee>,
      ServerListQuery<{
        branchId?: string | null;
        departmentId?: string | null;
        status?: number | null;
      }> | void
    >({
      query: (query) => ({
        url: '/hr/employees',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('HR', result),
    }),
    createEmployee: builder.mutation<
      { id?: string },
      {
        employeeNumber: string;
        firstName: string;
        middleName?: string | null;
        lastName: string;
        email?: string | null;
        telephone: string;
        paymentMethod?: string | null;
        bankName?: string | null;
        bankAccountName?: string | null;
        bankAccountNumber?: string | null;
        mobileMoneyNumber?: string | null;
        branchId?: string | null;
        locationId?: string | null;
        departmentId?: string | null;
        jobTitleId?: string | null;
        managerEmployeeId?: string | null;
        hireDate: string;
        employmentStatus?: number;
        employmentType?: number;
      }
    >({
      query: (body) => ({
        url: '/hr/employees',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('HR'),
    }),
    getEmployee: builder.query<Employee, string>({
      query: (id) => ({
        url: `/hr/employees/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'HR', id }],
    }),
    updateEmployee: builder.mutation<
      { id?: string },
      {
        id: string;
        body: {
          firstName?: string;
          middleName?: string | null;
          lastName?: string;
          email?: string | null;
          telephone?: string;
          paymentMethod?: string | null;
          bankName?: string | null;
          bankAccountName?: string | null;
          bankAccountNumber?: string | null;
          mobileMoneyNumber?: string | null;
          branchId?: string | null;
          locationId?: string | null;
          departmentId?: string | null;
          jobTitleId?: string | null;
          managerEmployeeId?: string | null;
          employmentStatus?: number;
          employmentType?: number;
          confirmationDate?: string | null;
          terminationDate?: string | null;
          terminationReason?: string | null;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/hr/employees/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'HR', id },
        ...invalidateEntityListTag('HR'),
      ],
    }),
    createEmployeeUserAccount: builder.mutation<
      { id?: string },
      { employeeId: string; roleId: string; branchId: string; locationId?: string | null }
    >({
      query: ({ employeeId, ...body }) => ({
        url: `/hr/employees/${employeeId}/create-user`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { employeeId }) => [
        { type: 'HR', id: employeeId },
        ...invalidateEntityListTag('HR'),
      ],
    }),
    listAttendance: builder.query<
      ServerListResponse<AttendanceRecord>,
      {
        from: string;
        to: string;
        employeeId?: string | null;
        branchId?: string | null;
        page?: number;
        pageSize?: number;
      }
    >({
      query: (params) => ({
        url: '/hr/attendance',
        params,
      }),
      providesTags: (result) => provideEntityListTags('HR', result),
    }),
    checkInAttendance: builder.mutation<
      { id?: string },
      {
        employeeId: string;
        branchId?: string | null;
        locationId?: string | null;
        checkedInAt?: string;
      }
    >({
      query: (body) => ({
        url: '/hr/attendance/check-in',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('HR'),
    }),
    checkOutAttendance: builder.mutation<
      { id?: string },
      { employeeId: string; checkedOutAt?: string }
    >({
      query: (body) => ({
        url: '/hr/attendance/check-out',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('HR'),
    }),
    listLeaveTypes: builder.query<
      ServerListResponse<LeaveType>,
      ServerListQuery<{ includeInactive?: boolean | null }> | void
    >({
      query: (query) => ({
        url: '/hr/leave-types',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('HR', result),
    }),
    listLeaveTypeOptions: builder.query<LeaveType[], void>({
      query: () => ({
        url: '/hr/leave-types/options',
      }),
      providesTags: [{ type: 'HR', id: 'LEAVE_TYPE_OPTIONS' }],
    }),
    createLeaveType: builder.mutation<
      { id?: string },
      { code?: string | null; name: string; isPaid?: boolean }
    >({
      query: (body) => ({
        url: '/hr/leave-types',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('HR'),
    }),
    listLeaveRequests: builder.query<
      ServerListResponse<LeaveRequest>,
      {
        employeeId?: string | null;
        status?: number | null;
        page?: number;
        pageSize?: number;
      } | void
    >({
      query: (query) => ({
        url: '/hr/leave-requests',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('HR', result),
    }),
    createLeaveRequest: builder.mutation<
      { id?: string },
      {
        employeeId: string;
        leaveTypeId: string;
        dateFrom: string;
        dateTo: string;
        reason?: string | null;
      }
    >({
      query: (body) => ({
        url: '/hr/leave-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('HR'),
    }),
    approveLeaveRequest: builder.mutation<{ id?: string }, string>({
      query: (id) => ({
        url: `/hr/leave-requests/${id}/approve`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'HR', id },
        ...invalidateEntityListTag('HR'),
      ],
    }),
    approveLeaveRequestByManager: builder.mutation<{ id?: string }, string>({
      query: (id) => ({
        url: `/hr/leave-requests/${id}/manager-approve`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'HR', id },
        ...invalidateEntityListTag('HR'),
      ],
    }),
    rejectLeaveRequest: builder.mutation<{ id?: string }, { id: string; reason?: string | null }>({
      query: ({ id, reason }) => ({
        url: `/hr/leave-requests/${id}/reject`,
        method: 'POST',
        body: { reason: reason ?? null },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'HR', id },
        ...invalidateEntityListTag('HR'),
      ],
    }),
    rejectLeaveRequestByManager: builder.mutation<
      { id?: string },
      { id: string; reason?: string | null }
    >({
      query: ({ id, reason }) => ({
        url: `/hr/leave-requests/${id}/manager-reject`,
        method: 'POST',
        body: { reason: reason ?? null },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'HR', id },
        ...invalidateEntityListTag('HR'),
      ],
    }),
  }),
});

export const {
  useListDepartmentsQuery,
  useListDepartmentOptionsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useListJobTitlesQuery,
  useListJobTitleOptionsQuery,
  useCreateJobTitleMutation,
  useUpdateJobTitleMutation,
  useListEmployeesQuery,
  useCreateEmployeeMutation,
  useGetEmployeeQuery,
  useUpdateEmployeeMutation,
  useCreateEmployeeUserAccountMutation,
  useListAttendanceQuery,
  useCheckInAttendanceMutation,
  useCheckOutAttendanceMutation,
  useListLeaveTypesQuery,
  useListLeaveTypeOptionsQuery,
  useCreateLeaveTypeMutation,
  useListLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useApproveLeaveRequestMutation,
  useApproveLeaveRequestByManagerMutation,
  useRejectLeaveRequestMutation,
  useRejectLeaveRequestByManagerMutation,
} = hrApi;
