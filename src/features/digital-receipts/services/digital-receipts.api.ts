import { api } from '@/services/api';
import type {
  CustomerReceiptPreference,
  ParcelReceiptOptions,
  ReceiptDeliveryChannel,
  ReceiptKind,
  SendDigitalReceiptResponse,
} from '../types';

const preferenceTag = (id: string) => ({ type: 'Customers' as const, id: `RECEIPT_PREF_${id}` });

export const digitalReceiptsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerReceiptPreference: builder.query<CustomerReceiptPreference, string>({
      query: (customerId) => ({ url: `/digital-receipts/customers/${customerId}/preference` }),
      providesTags: (_result, _error, customerId) => [preferenceTag(customerId)],
    }),
    saveCustomerReceiptPreference: builder.mutation<
      { customerId: string; channels: ReceiptDeliveryChannel[] },
      { customerId: string; channels: ReceiptDeliveryChannel[] }
    >({
      query: ({ customerId, channels }) => ({
        url: `/digital-receipts/customers/${customerId}/preference`,
        method: 'PUT',
        body: { channels },
      }),
      invalidatesTags: (_result, _error, { customerId }) => [preferenceTag(customerId)],
    }),
    getParcelReceiptOptions: builder.query<
      ParcelReceiptOptions,
      { parcelId: string; kind: ReceiptKind }
    >({
      query: ({ parcelId, kind }) => ({
        url: `/digital-receipts/parcels/${parcelId}/options`,
        params: { kind },
      }),
    }),
    sendDigitalReceipt: builder.mutation<
      SendDigitalReceiptResponse,
      { parcelId: string; kind: ReceiptKind; channels: ReceiptDeliveryChannel[] }
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/digital-receipts/parcels/${parcelId}/send`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetCustomerReceiptPreferenceQuery,
  useSaveCustomerReceiptPreferenceMutation,
  useGetParcelReceiptOptionsQuery,
  useSendDigitalReceiptMutation,
} = digitalReceiptsApi;
