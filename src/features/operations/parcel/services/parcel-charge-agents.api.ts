import { api } from '@/services/api';
import type { ParcelChargeAgentOption, ParcelChargeAgentSource } from '../types';

export const parcelChargeAgentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listParcelChargeAgents: builder.query<
      ParcelChargeAgentOption[],
      { source: ParcelChargeAgentSource; companyId: string; branchId: string }
    >({
      query: ({ source }) => ({
        url:
          source === 'self-service'
            ? '/self-service/charge-agent-options'
            : '/shipments/bookings/charge-agent-options',
      }),
      providesTags: [{ type: 'Users', id: 'OPTIONS' }],
    }),
  }),
});

export const { useListParcelChargeAgentsQuery } = parcelChargeAgentsApi;
