import { api } from '@/services/api';
import type { ReceiverReceiptParcel } from '../utils/build-receiver-receipt-data';

export type ReceiptReprintTax = {
  settlementMode?: 'CREDIT';
  grossAmountPsw: number;
  vatPsw: number;
  getfundPsw: number;
  nhilPsw: number;
  covidPsw: number;
  taxTotalPsw: number;
  taxComponentKeys: string[];
};

export type ReceiverReceiptReprint = ReceiptReprintTax & {
  receiverPrincipalPsw: number;
  storageChargePsw: number;
  senderPaidPsw: number;
  issuedAt: string;
  receivedByName: string | null;
  parcel?: ReceiverReceiptParcel & {
    destinationName: string | null;
    pickupLocationName: string | null;
    chargePsw: number;
  };
};

const receiptReprintApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReceiverReceiptReprint: builder.query<
      ReceiverReceiptReprint,
      { id: string; includeParcel?: boolean }
    >({
      query: ({ id, includeParcel }) => ({
        url: `/shipments/parcels/${id}/receiver-receipt-reprint`,
        params: includeParcel ? { includeParcel: 'true' } : undefined,
      }),
    }),
    getReceiptReprintTax: builder.query<ReceiptReprintTax | null, string>({
      query: (parcelId) => `/shipments/parcels/${parcelId}/receipt-reprint-tax`,
    }),
  }),
});

export const { useLazyGetReceiptReprintTaxQuery, useLazyGetReceiverReceiptReprintQuery } =
  receiptReprintApi;
