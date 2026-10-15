import type { ServerListQuery } from '@/services/rtk-query';

export type ParcelReceiverQuery = ServerListQuery<{
  companyId?: string | null;
  destinationId?: string | null;
  status?: number | null;
  senderPaid?: boolean | null;
  cashierCollectionRequired?: boolean | null;
  hasPickupQueue?: boolean | null;
}>;
