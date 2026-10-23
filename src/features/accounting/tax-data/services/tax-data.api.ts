import { api } from '@/services/api';
import type {
  TaxDataBranchOptions,
  TaxDataCounts,
  TaxDataFilters,
  TaxDataRecords,
  TaxDataSelection,
  TaxDataConfirmation,
} from '../types';
type ScopedFilters = TaxDataFilters & { viewerKey: string };
const taxDataApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTaxDataOptions: builder.query<TaxDataBranchOptions, string>({
      query: () => '/accounting/tax-data/options',
    }),
    getTaxDataCounts: builder.query<TaxDataCounts, ScopedFilters>({
      query: ({ viewerKey: _viewerKey, ...params }) => ({
        url: '/accounting/tax-data/counts',
        params,
      }),
    }),
    getTaxDataRecords: builder.query<
      TaxDataRecords,
      ScopedFilters & { page: number; limit: number }
    >({
      query: ({ viewerKey: _viewerKey, ...params }) => ({
        url: '/accounting/tax-data/records',
        params,
      }),
    }),
    exportTaxData: builder.mutation<Blob, { rows: TaxDataSelection[] }>({
      query: (body) => ({
        url: '/accounting/tax-data/export',
        method: 'POST',
        body,
        responseHandler: async (response) => (response.ok ? response.blob() : response.json()),
      }),
    }),
    confirmTaxData: builder.mutation<TaxDataConfirmation, { rows: TaxDataSelection[] }>({
      query: (body) => ({ url: '/accounting/tax-data/confirm', method: 'POST', body }),
      invalidatesTags: ['Accounting', 'Bookings'],
    }),
  }),
});
export const {
  useGetTaxDataOptionsQuery,
  useLazyGetTaxDataCountsQuery,
  useLazyGetTaxDataRecordsQuery,
  useExportTaxDataMutation,
  useConfirmTaxDataMutation,
} = taxDataApi;
