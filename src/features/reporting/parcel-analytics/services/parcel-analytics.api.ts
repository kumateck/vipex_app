import { api } from '@/services/api';
import type { ParcelAnalyticsQuery, ParcelAnalyticsReport, ParcelAnalyticsDetails } from '../types';

type ScopedQuery = ParcelAnalyticsQuery & { viewerKey: string };

const parcelAnalyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getParcelAnalytics: builder.query<ParcelAnalyticsReport, ScopedQuery>({
      query: ({ viewerKey: _viewerKey, ...params }) => ({
        url: '/reports/parcel-analytics',
        params,
      }),
    }),
    getParcelAnalyticsDetails: builder.query<
      ParcelAnalyticsDetails,
      ScopedQuery & { page: number }
    >({
      query: ({ viewerKey: _viewerKey, ...params }) => ({
        url: '/reports/parcel-analytics/details',
        params,
      }),
    }),
  }),
});

export const { useGetParcelAnalyticsQuery, useGetParcelAnalyticsDetailsQuery } = parcelAnalyticsApi;
