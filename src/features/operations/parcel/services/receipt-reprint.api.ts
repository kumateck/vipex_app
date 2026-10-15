import { api } from '@/services/api';

export type ReceiptReprintTax = {
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
};

const receiptReprintApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReceiverReceiptReprint: builder.query<ReceiverReceiptReprint, string>({
      query: (parcelId) => `/shipments/parcels/${parcelId}/receiver-receipt-reprint`,
    }),
    getReceiptReprintTax: builder.query<ReceiptReprintTax | null, string>({
      query: (parcelId) => `/shipments/parcels/${parcelId}/receipt-reprint-tax`,
    }),
  }),
});

export const { useLazyGetReceiptReprintTaxQuery, useLazyGetReceiverReceiptReprintQuery } =
  receiptReprintApi;
