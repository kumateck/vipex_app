import { api } from '@/services/api';
import type { BranchSwitchOptions } from '@/shared/auth/branch-switch';

const branchSwitchApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBranchSwitchOptions: builder.query<BranchSwitchOptions, void>({
      query: () => '/auth/me/branch-options',
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetBranchSwitchOptionsQuery } = branchSwitchApi;
