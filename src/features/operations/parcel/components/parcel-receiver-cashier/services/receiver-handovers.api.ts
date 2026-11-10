import { api } from '@/services/api';
import type {
  ReceiverCashierSignature,
  ReceiverHandoverListQuery,
  ReceiverHandoverPage,
} from '@/shared/shipments/receiver-cashier-signature';

type HandoverKey = { parcelId: string; handoverId: string };

const receiverHandoversApi = api.injectEndpoints({
  endpoints: (builder) => ({
    watchReceiverHandovers: builder.mutation<ReceiverHandoverPage, ReceiverHandoverListQuery>({
      query: (params) => ({ url: '/payments/receiver-handovers', params }),
    }),
    getReceiverHandoverPreview: builder.query<
      { signatureImage: string; signedAt: string },
      HandoverKey
    >({
      query: ({ parcelId, handoverId }) => ({
        url: `/payments/receiver-handovers/${parcelId}/signature`,
        params: { handoverId },
      }),
      keepUnusedDataFor: 0,
    }),
    captureReceiverHandover: builder.mutation<
      { id: string; signedAt: string },
      HandoverKey & { signature: ReceiverCashierSignature }
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/payments/receiver-handovers/${parcelId}/signature`,
        method: 'POST',
        body,
      }),
    }),
    confirmReceiverHandover: builder.mutation<
      { id: string; alreadyConfirmed: boolean },
      HandoverKey
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/payments/receiver-handovers/${parcelId}/confirm`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { parcelId }) => [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Bookings', id: parcelId },
      ],
    }),
  }),
});

export const {
  useGetReceiverHandoverPreviewQuery,
  useWatchReceiverHandoversMutation,
  useCaptureReceiverHandoverMutation,
  useConfirmReceiverHandoverMutation,
} = receiverHandoversApi;
