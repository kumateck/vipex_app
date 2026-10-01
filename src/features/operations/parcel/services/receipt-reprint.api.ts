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

const receiptReprintApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReceiptReprintTax: builder.query<ReceiptReprintTax | null, string>({
      query: (parcelId) => `/shipments/parcels/${parcelId}/receipt-reprint-tax`,
    }),
  }),
});

export const { useLazyGetReceiptReprintTaxQuery } = receiptReprintApi;
