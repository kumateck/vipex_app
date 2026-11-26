import { api } from '@/services/api';
import type {
  BatchSignaturePage,
  BatchSignaturePreparation,
  BatchSignatureStatus,
} from '@/shared/shipments/batch-signature-request';
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
    listBatchSignatures: builder.query<BatchSignaturePage, { search?: string; after?: string }>({
      query: (params) => ({ url: '/payments/batch-handover-signatures', params }),
      keepUnusedDataFor: 0,
    }),
    requestBatchSignature: builder.mutation<
      { requestId: string },
      Request<BatchSignaturePreparation>
    >({
      query: ({ workflow, ...body }) => ({
        url: `${root(workflow)}/signature/request`,
        method: 'POST',
        body,
      }),
    }),
    getBatchSignature: builder.query<BatchSignatureStatus | null, Request<{ id: string }>>({
      query: ({ workflow, id }) => `${root(workflow)}/${id}/signature`,
      keepUnusedDataFor: 0,
    }),
    cancelBatchSignature: builder.mutation<
      { cancelled: boolean },
      Request<{ id: string; requestId: string }>
    >({
      query: ({ workflow, id, requestId }) => ({
        url: `${root(workflow)}/${id}/signature/cancel`,
        method: 'POST',
        body: { requestId },
      }),
    }),
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
  useListBatchSignaturesQuery,
  useRequestBatchSignatureMutation,
  useGetBatchSignatureQuery,
  useCancelBatchSignatureMutation,
  useSearchBatchParcelsMutation,
  useRequestBatchOtpMutation,
  useVerifyBatchOtpMutation,
  useConfirmBatchHandoverMutation,
} = batchHandoverApi;
