import { api } from '@/services/api';

export type SelfServiceDraft = {
  id: string;
  companyId: string;
  branchId: string;
  status: number;
  senderFullname: string;
  senderPhone: string;
  senderPhone2: string | null;
  receiverFullname: string;
  receiverPhone: string;
  receiverPhone2: string | null;
  destinationBranchId: string | null;
  destinationLocationId: string | null;
  parcelContent: string;
  parcelValuePsw: number;
  callSender: boolean;
  termsVersion: string | null;
  termsAcceptedAt: string | null;
  expiresAt: string;
  claimedBy: string | null;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompleteSelfServiceDraftInput = {
  id: string;
  destinationId: string;
  pickupLocationId?: string | null;
  parcelDetails: string;
  chargeCedis: number | string;
  chargeAgentUserId?: string | null;
  paymentResponsibility: 'SENDER' | 'RECEIVER' | 'SPLIT';
  senderSettlementMode: 'PAY_NOW' | 'CREDIT';
  senderPartialPaymentCedis?: number | string | null;
  callSender?: boolean;
};

export type CompleteSelfServiceDraftResponse = {
  bookingId: string;
  parcels: Array<{ id: string; trackingCode: string; bookingCode: string }>;
};

export const selfServiceAgentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listSelfServiceDrafts: builder.query<SelfServiceDraft[], void>({
      query: () => ({ url: '/self-service/drafts' }),
      providesTags: [{ type: 'Bookings', id: 'SELF_SERVICE_LIST' }],
    }),
    getSelfServiceDraft: builder.query<SelfServiceDraft, string>({
      query: (id) => ({ url: `/self-service/drafts/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Bookings', id: `SELF_SERVICE_${id}` }],
    }),
    updateSelfServiceDraftCustomers: builder.mutation<
      SelfServiceDraft,
      {
        id: string;
        expectedUpdatedAt: string;
        sender: { fullname: string; phone: string; phone2: string | null };
        receiver: { fullname: string; phone: string; phone2: string | null };
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/self-service/drafts/${id}/customers`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, error, { id }) =>
        error
          ? []
          : [
              { type: 'Bookings', id: 'SELF_SERVICE_LIST' },
              { type: 'Bookings', id: `SELF_SERVICE_${id}` },
              'Customers',
            ],
    }),
    claimSelfServiceDraft: builder.mutation<SelfServiceDraft, string>({
      query: (id) => ({ url: `/self-service/drafts/${id}/claim`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Bookings', id: 'SELF_SERVICE_LIST' },
        { type: 'Bookings', id: `SELF_SERVICE_${id}` },
      ],
    }),
    completeSelfServiceDraft: builder.mutation<
      CompleteSelfServiceDraftResponse,
      CompleteSelfServiceDraftInput
    >({
      query: ({ id, ...body }) => ({
        url: `/self-service/drafts/${id}/complete`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Bookings', id: 'SELF_SERVICE_LIST' },
        { type: 'Bookings', id: `SELF_SERVICE_${id}` },
      ],
    }),
    cancelSelfServiceDraft: builder.mutation<{ id: string }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/self-service/drafts/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Bookings', id: 'SELF_SERVICE_LIST' },
        { type: 'Bookings', id: `SELF_SERVICE_${id}` },
      ],
    }),
  }),
});

export const {
  useListSelfServiceDraftsQuery,
  useGetSelfServiceDraftQuery,
  useClaimSelfServiceDraftMutation,
  useUpdateSelfServiceDraftCustomersMutation,
  useCompleteSelfServiceDraftMutation,
  useCancelSelfServiceDraftMutation,
} = selfServiceAgentApi;
