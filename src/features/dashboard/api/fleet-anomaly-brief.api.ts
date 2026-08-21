import { api } from '@/services/api';

export type FleetAnomalyBriefDriverRisk = {
  driverEmployeeName: string | null;
  anomalyCount: number;
  averageVariancePct: number;
};

export type FleetAnomalyBriefRouteCostRisk = {
  routePlanName: string | null;
  costPerKm: number;
};

export type FleetAnomalyBriefResult = {
  id: string;
  periodFrom: string;
  periodTo: string;
  branchId: string | null;
  narrative: string | null;
  provider: string | null;
  succeeded: boolean;
  generatedByUserId: string;
  createdAt: string;
};

export const fleetAnomalyBriefApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLatestFleetAnomalyBrief: builder.query<FleetAnomalyBriefResult | null, void>({
      query: () => ({ url: '/fleet-anomaly-brief/latest' }),
      providesTags: [{ type: 'FleetAnomalyBrief', id: 'LATEST' }],
    }),
    generateFleetAnomalyBrief: builder.mutation<
      FleetAnomalyBriefResult,
      { from: string; to: string; branchId?: string | null }
    >({
      query: (body) => ({
        url: '/fleet-anomaly-brief/generate',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'FleetAnomalyBrief', id: 'LATEST' }],
    }),
  }),
});

export const { useGetLatestFleetAnomalyBriefQuery, useGenerateFleetAnomalyBriefMutation } =
  fleetAnomalyBriefApi;
