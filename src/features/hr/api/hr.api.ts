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
} = hrApi;
