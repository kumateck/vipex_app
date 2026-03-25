import { api } from '@/services/api';

export interface CompanyModuleRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isCore: boolean;
  isActive: boolean;
  isEnabled: boolean;
  enabledAt: string | null;
  disabledAt: string | null;
  configuredBy: string | null;
  settings: unknown;
}

export const companyModulesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCompanyModules: builder.query<CompanyModuleRow[], void>({
      query: () => ({
        url: '/company-modules',
      }),
      providesTags: ['Auth'],
    }),
    setCompanyModuleState: builder.mutation<
      { id?: string },
      { moduleCode: string; isEnabled: boolean; settings?: unknown }
    >({
      query: ({ moduleCode, ...body }) => ({
        url: `/company-modules/${moduleCode}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Auth', 'Accounting'],
    }),
  }),
});

export const { useListCompanyModulesQuery, useSetCompanyModuleStateMutation } = companyModulesApi;
