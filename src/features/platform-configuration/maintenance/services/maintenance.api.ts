import { api } from '@/services/api';
import type { MaintenanceRun, MaintenanceRunRequest, MaintenanceScript } from '../types';

const maintenanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMaintenanceScripts: builder.query<MaintenanceScript[], void>({
      query: () => '/maintenance/scripts',
    }),
    getMaintenanceRuns: builder.query<MaintenanceRun[], { companyId: string; userId: string }>({
      query: () => '/maintenance/runs',
      keepUnusedDataFor: 0,
    }),
    runMaintenanceScript: builder.mutation<MaintenanceRun, MaintenanceRunRequest>({
      query: (body) => ({ url: '/maintenance/runs', method: 'POST', body }),
      invalidatesTags: (_result, _error, request) =>
        request.mode === 'execute' ? [{ type: 'Bookings', id: 'LIST' }] : [],
    }),
  }),
});
export const {
  useGetMaintenanceScriptsQuery,
  useGetMaintenanceRunsQuery,
  useRunMaintenanceScriptMutation,
} = maintenanceApi;
