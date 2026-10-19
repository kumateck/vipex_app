import type { ServerListQuery } from '@/services/rtk-query';

export type CardMode = 'none' | 'existing' | 'new';
export type HandoverTarget = 'main' | 'second';

export type WaitingPickupQuery = ServerListQuery<{
  companyId?: string | null;
  destinationId?: string | null;
  status?: number | null;
  senderPaid?: boolean | null;
  cashierCollectionRequired?: boolean | null;
  hasPickupQueue?: boolean | null;
}>;

export function getQueueFilterBySearch(isPickupQueueEnabled: boolean, search?: string) {
  if (!isPickupQueueEnabled) return undefined;
  return search?.trim() ? undefined : true;
}
