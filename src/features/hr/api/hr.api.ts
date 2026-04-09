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
  departmentId?: string | null;
  departmentName?: string | null;
  code?: string | null;
  name: string;
  description?: string | null;
  defaultLeaveDays: number;
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
  profileImageUrl?: string | null;
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
  reportingOfficerTitleId?: string | null;
  officerEmployeeId?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  supervisorEmployeeId?: string | null;
  alternatePhone?: string | null;
  confirmationDate?: string | null;
  terminationDate?: string | null;
  terminationReason?: string | null;
  hasUserAccount: boolean;
}

export interface EmployeeOption {
  id: string;
  employeeNumber: string;
  displayName: string;
  branchId?: string | null;
  locationId?: string | null;
  departmentId?: string | null;
  jobTitleId?: string | null;
  employmentStatus: number;
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
  minAdvanceDays: number;
  allowEmergencySameDay: boolean;
  colorHex?: string;
  calendarPriority?: number;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName?: string | null;
  supervisorEmployeeId?: string | null;
  leaveTypeId: string;
  leaveTypeName?: string | null;
  leaveTypeIsPaid?: boolean;
  dateFrom: string;
  dateTo: string;
  daysCount: number;
  selectionMode?: number;
  weekStartDate?: string | null;
  weekCount?: number | null;
  swapLockUntil?: string | null;
  isEmergency: boolean;
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

export interface LeaveCalendarEmployee {
  id: string;
  employeeNumber: string;
  displayName: string;
  branchId?: string | null;
  branchName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  jobTitleName?: string | null;
}

export interface LeaveCalendarItem {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName?: string | null;
  leaveTypeColorHex?: string | null;
  leaveTypeCalendarPriority?: number | null;
  dateFrom: string;
  dateTo: string;
  daysCount: number;
  status: number;
  managerApprovalStatus: number;
  reason?: string | null;
  selectionMode?: number;
  weekStartDate?: string | null;
  weekCount?: number | null;
  swapLockUntil?: string | null;
  isEmergency: boolean;
}

export interface LeaveCalendarResponse {
  employees: LeaveCalendarEmployee[];
  leaveItems: LeaveCalendarItem[];
}

export interface LeaveSwap {
  id: string;
  companyId: string;
  requesterEmployeeId: string;
  requesterEmployeeName?: string | null;
  requesterLeaveRequestId: string;
  targetEmployeeId: string;
  targetEmployeeName?: string | null;
  targetLeaveRequestId: string;
  requesterOriginalFrom: string;
  requesterOriginalTo: string;
  targetOriginalFrom: string;
  targetOriginalTo: string;
  requesterProposedFrom: string;
  requesterProposedTo: string;
  targetProposedFrom: string;
  targetProposedTo: string;
  status: number;
  peerConfirmedBy?: string | null;
  peerConfirmedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdBy?: string | null;
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
      {
        departmentId?: string | null;
        code?: string | null;
        name: string;
        description?: string | null;
        defaultLeaveDays?: number;
      }
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
          departmentId?: string | null;
          name?: string;
          description?: string | null;
          defaultLeaveDays?: number;
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
        jobTitleId?: string | null;
        officerEmployeeId?: string | null;
        status?: number | null;
      }> | void
    >({
      query: (query) => ({
        url: '/hr/employees',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('HR', result),
    }),
    listEmployeeOptions: builder.query<
      EmployeeOption[],
      {
        branchId?: string | null;
        departmentId?: string | null;
        jobTitleId?: string | null;
        officerEmployeeId?: string | null;
        status?: number | null;
        search?: string;
      } | void
    >({
      query: (params) => ({
        url: '/hr/employees/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'HR', id: 'EMPLOYEE_OPTIONS' }],
    }),
    createEmployee: builder.mutation<
      { id?: string },
      {
        employeeNumber: string;
        firstName: string;
        middleName?: string | null;
        lastName: string;
        email?: string | null;
        profileImageUrl?: string | null;
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
        reportingOfficerTitleId?: string | null;
        officerEmployeeId?: string | null;
        supervisorEmployeeId?: string | null;
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
          profileImageUrl?: string | null;
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
          reportingOfficerTitleId?: string | null;
          officerEmployeeId?: string | null;
          supervisorEmployeeId?: string | null;
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
      {
        code?: string | null;
        name: string;
        isPaid?: boolean;
        minAdvanceDays?: number;
        allowEmergencySameDay?: boolean;
      }
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
        leaveTypeId?: string | null;
        status?: number | null;
        dateFrom?: string;
        dateTo?: string;
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
        selectionMode?: number;
        weekStartDate?: string | null;
        weekCount?: number | null;
        isEmergency?: boolean;
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
    getLeaveCalendar: builder.query<
      LeaveCalendarResponse,
      {
        from: string;
        to: string;
        employeeId?: string | null;
        status?: number | null;
        branchId?: string | null;
        departmentId?: string | null;
      }
    >({
      query: (params) => ({
        url: '/hr/leave-calendar',
        params,
      }),
      providesTags: [{ type: 'HR', id: 'LEAVE_CALENDAR' }],
    }),
    listLeaveSwaps: builder.query<
      ServerListResponse<LeaveSwap>,
      {
        employeeId?: string | null;
        status?: number | null;
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        pageSize?: number;
      } | void
    >({
      query: (query) => ({
        url: '/hr/leave-swaps',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('HR', result),
    }),
    createLeaveSwap: builder.mutation<
      { id?: string },
      { requesterLeaveRequestId: string; targetLeaveRequestId: string }
    >({
      query: (body) => ({
        url: '/hr/leave-swaps',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, _arg) => [
        ...invalidateEntityListTag('HR'),
        { type: 'HR', id: 'LEAVE_CALENDAR' },
      ],
    }),
    confirmLeaveSwap: builder.mutation<{ id?: string }, string>({
      query: (id) => ({
        url: `/hr/leave-swaps/${id}/confirm`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (_result, _error, _arg) => [
        ...invalidateEntityListTag('HR'),
        { type: 'HR', id: 'LEAVE_CALENDAR' },
      ],
    }),
    approveLeaveSwap: builder.mutation<{ id?: string }, string>({
      query: (id) => ({
        url: `/hr/leave-swaps/${id}/approve`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (_result, _error, _arg) => [
        ...invalidateEntityListTag('HR'),
        { type: 'HR', id: 'LEAVE_CALENDAR' },
      ],
    }),
    rejectLeaveSwap: builder.mutation<{ id?: string }, { id: string; reason?: string | null }>({
      query: ({ id, reason }) => ({
        url: `/hr/leave-swaps/${id}/reject`,
        method: 'POST',
        body: { reason: reason ?? null },
      }),
      invalidatesTags: (_result, _error, _arg) => [
        ...invalidateEntityListTag('HR'),
        { type: 'HR', id: 'LEAVE_CALENDAR' },
      ],
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
  useListEmployeeOptionsQuery,
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
  useGetLeaveCalendarQuery,
  useListLeaveSwapsQuery,
  useCreateLeaveSwapMutation,
  useConfirmLeaveSwapMutation,
  useApproveLeaveSwapMutation,
  useRejectLeaveSwapMutation,
  useApproveLeaveRequestMutation,
  useApproveLeaveRequestByManagerMutation,
  useRejectLeaveRequestMutation,
  useRejectLeaveRequestByManagerMutation,
} = hrApi;
