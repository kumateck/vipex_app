import { api } from '@/services/api';
import type {
  BatchConfirmation,
  BatchHandoverWorkflow,
  BatchOtpProof,
  BatchOtpRequest,
  BatchOtpSession,
  BatchOtpVerify,
  BatchPickupPage,
} from '@/shared/shipments/parcel-batch-handover';

type Request<T> = T & { workflow: BatchHandoverWorkflow };
const root = (workflow: BatchHandoverWorkflow) => `/payments/${workflow}-batch-handover`;

const batchHandoverApi = api.injectEndpoints({
  endpoints: (builder) => ({
    searchBatchParcels: builder.mutation<
      BatchPickupPage,
      Request<{ telephone: string; after?: string }>
    >({
      query: ({ workflow, ...params }) => ({ url: root(workflow), params }),
    }),
    requestBatchOtp: builder.mutation<BatchOtpSession, Request<BatchOtpRequest>>({
      query: ({ workflow, ...body }) => ({
        url: `${root(workflow)}/otp/request`,
        method: 'POST',
        body,
      }),
    }),
    verifyBatchOtp: builder.mutation<BatchOtpProof, Request<BatchOtpVerify>>({
      query: ({ workflow, ...body }) => ({
        url: `${root(workflow)}/otp/verify`,
        method: 'POST',
        body,
      }),
    }),
    confirmBatchHandover: builder.mutation<
      { parcelIds: string[]; alreadyConfirmed: boolean },
      Request<BatchConfirmation>
    >({
      query: ({ workflow, ...body }) => ({
        url: `${root(workflow)}/confirm`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'Bookings', id: 'LIST' },
              ...result.parcelIds.map((id) => ({ type: 'Bookings' as const, id })),
            ]
          : [],
    }),
  }),
});

export const {
  useSearchBatchParcelsMutation,
  useRequestBatchOtpMutation,
  useVerifyBatchOtpMutation,
  useConfirmBatchHandoverMutation,
} = batchHandoverApi;
