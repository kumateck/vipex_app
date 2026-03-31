import { api } from '@/services/api';

export type ModuleWorkspaceOverview = {
  moduleCode: string;
  snapshotAt: string;
  checkpoints: string[];
  metrics: {
    totalBranches: number;
    totalCustomers: number;
    totalEmployees: number;
    totalParcels: number;
    totalPayments: number;
  };
};

export const moduleWorkspaceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getModuleWorkspaceOverview: builder.query<ModuleWorkspaceOverview, string>({
      query: (moduleCode) => ({
        url: `/module-workspace/${moduleCode}/overview`,
      }),
    }),
  }),
});

export const { useGetModuleWorkspaceOverviewQuery } = moduleWorkspaceApi;
