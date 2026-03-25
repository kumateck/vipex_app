import { api } from '@/services/api';
import { invalidateEntityListTag, provideEntityListTags } from '@/services/rtk-query';

export interface CompanyModule {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isCore: boolean;
  isActive: boolean;
  isEnabled: boolean;
  enabledAt?: string | null;
  disabledAt?: string | null;
  configuredBy?: string | null;
  settings?: unknown;
}

export const companyModulesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCompanyModules: builder.query<{ data: CompanyModule[] } | CompanyModule[], void>({
      query: () => ({ url: '/company-modules/' }),
      transformResponse: (response: { data: CompanyModule[] } | CompanyModule[]) => response,
      providesTags: (result) =>
        provideEntityListTags('CompanyModules', Array.isArray(result) ? { data: result } : result),
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
      invalidatesTags: invalidateEntityListTag('CompanyModules'),
    }),
  }),
});

export const { useListCompanyModulesQuery, useSetCompanyModuleStateMutation } = companyModulesApi;
