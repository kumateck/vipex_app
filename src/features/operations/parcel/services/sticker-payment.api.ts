import { api } from '@/services/api';
import type { VerifiedStickerPayment } from '@/shared/printing';

const stickerPaymentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    verifyStickerPayment: builder.query<
      VerifiedStickerPayment,
      { trackingCode: string; bookingCode: string }
    >({
      query: (params) => ({ url: '/shipments/parcels/sticker-payment', params, cache: 'no-store' }),
      keepUnusedDataFor: 0,
    }),
  }),
});
export const { useLazyVerifyStickerPaymentQuery } = stickerPaymentApi;
