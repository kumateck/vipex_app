import { api } from '@/services/api';

export type MomoTransactionStatusValue = 0 | 1 | 2 | 3 | 4; // PENDING/SUCCESSFUL/FAILED/TIMED_OUT/CANCELLED

export type MomoTransactionStatusResponse = {
  id: string;
  status: MomoTransactionStatusValue;
  statusReason?: string | null;
};

export const momoApi = api.injectEndpoints({
  endpoints: (builder) => ({
    initiateMomoRequestToPay: builder.mutation<
      { id: string; status: MomoTransactionStatusValue },
      { parcelId: string; flow: 'sender' | 'receiver'; momoNumber: string; amountCedis: number }
    >({
      query: (body) => ({
        url: '/momo/requesttopay',
        method: 'POST',
        body,
      }),
    }),
    getMomoTransactionStatus: builder.query<MomoTransactionStatusResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/momo/requesttopay/${id}/status`,
      }),
    }),
  }),
});

export const { useInitiateMomoRequestToPayMutation, useGetMomoTransactionStatusQuery } = momoApi;
