import { api } from '@/services/api';

import type { ParcelStorageSettlement } from '../parcel.api';
export const parcelApiPart2 = api.injectEndpoints({
  endpoints: (builder) => ({
    collectSenderPayment: builder.mutation<
      {
        id: string;
        amounts: {
          grossPsw: number;
          netPsw: number;
          vatPsw: number;
          getfundPsw: number;
          nhilPsw: number;
          covidPsw: number;
          taxTotalPsw: number;
          taxComponentKeys: string[];
          grossCedis: number;
          netCedis: number;
          vatCedis: number;
          getfundCedis: number;
          nhilCedis: number;
          covidCedis: number;
          taxTotalCedis: number;
        };
      },
      {
        parcelId: string;
        amountCedis: number;
        method: number;
        component: number;
        payer: number;
        cashierType: number;
      }
    >({
      query: (body) => ({
        url: '/payments',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION_SUMMARY' },
      ],
    }),
    collectSenderAndProcess: builder.mutation<
      {
        parcelId: string;
        status: number;
        statusChanged: boolean;
        message: string;
        payment: null | {
          id: string;
          amounts: {
            grossPsw: number;
            netPsw: number;
            vatPsw: number;
            getfundPsw: number;
            nhilPsw: number;
            covidPsw: number;
            taxTotalPsw: number;
            taxComponentKeys: string[];
            grossCedis: number;
            netCedis: number;
            vatCedis: number;
            getfundCedis: number;
            nhilCedis: number;
            covidCedis: number;
            taxTotalCedis: number;
          };
          message?: string;
        };
      },
      {
        parcelId: string;
        amountCedis?: number | null;
        method: number;
        momoTransactionId?: string | null;
      }
    >({
      query: (body) => ({
        url: '/payments/collect-sender-and-process',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION_SUMMARY' },
      ],
    }),
    collectReceiverAndDeliver: builder.mutation<
      {
        parcelId: string;
        status: number;
        message: string;
        storageSettlement?: ParcelStorageSettlement;
        storagePayment?: { id: string; amounts: { grossCedis: number } } | null;
        receiptTaxBreakdown?: {
          vatCedis: number;
          getfundCedis: number;
          nhilCedis: number;
          covidCedis: number;
          taxTotalCedis: number;
          taxComponentKeys: string[];
        } | null;
        payment: null | {
          id: string;
          amounts: {
            grossPsw: number;
            netPsw: number;
            vatPsw: number;
            getfundPsw: number;
            nhilPsw: number;
            covidPsw: number;
            taxTotalPsw: number;
            taxComponentKeys: string[];
            grossCedis: number;
            netCedis: number;
            vatCedis: number;
            getfundCedis: number;
            nhilCedis: number;
            covidCedis: number;
            taxTotalCedis: number;
          };
          message?: string;
        };
      },
      {
        parcelId: string;
        amountCedis?: number | null;
        method: number;
        confirmedBy: string;
        storageAmountCedis?: number | string | null;
        secondReceiverId?: string | null;
        cardId?: string | null;
        cardNumber?: string | null;
        secondCardId?: string | null;
        secondCardNumber?: string | null;
        receiverOtpVerificationToken?: string;
        receiverOtpTarget?: 'main' | 'second';
        momoTransactionId?: string | null;
      }
    >({
      query: (body) => ({
        url: '/payments/collect-receiver-and-deliver',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION_SUMMARY' },
      ],
    }),
    requestReceiverOtp: builder.mutation<
      { expiresAt: string; channel?: 'sms' | 'whatsapp' },
      {
        parcelId: string;
        targetReceiver: 'main' | 'second';
        force?: boolean;
        phoneSlot?: 'primary' | 'secondary';
        channel?: 'sms' | 'whatsapp';
      }
    >({
      query: (body) => ({
        url: '/payments/receiver-otp/request',
        method: 'POST',
        body,
      }),
    }),
    verifyReceiverOtp: builder.mutation<
      { verificationToken: string; expiresAt: string },
      { parcelId: string; targetReceiver: 'main' | 'second'; otp: string }
    >({
      query: (body) => ({
        url: '/payments/receiver-otp/verify',
        method: 'POST',
        body,
      }),
    }),
    createConsignment: builder.mutation<
      { id: string; code: string; serialForDay: number },
      {
        companyId: string;
        sourceId: string;
        destinationId: string;
        consignmentDate: string;
        createdBy: string;
      }
    >({
      query: (body) => ({
        url: '/shipments/consignments',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    addConsignmentItems: builder.mutation<
      { added: number },
      {
        consignmentId: string;
        parcelIds: string[];
      }
    >({
      query: ({ consignmentId, parcelIds }) => ({
        url: `/shipments/consignments/${consignmentId}/items`,
        method: 'POST',
        body: { parcelIds },
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
  }),
});
