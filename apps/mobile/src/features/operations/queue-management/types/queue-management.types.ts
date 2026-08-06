import type { ParcelFullDetails, ParcelSearchRow, PickupQueueCard } from '@mobile/types/parcels';

export type QueueManagementState = {
  search: string;
  rows: ParcelSearchRow[];
  selectedParcel: ParcelSearchRow | null;
  selectedDetails: ParcelFullDetails | null;
  receiverQueueCards: PickupQueueCard[];
  waitingPickupQueueCards: PickupQueueCard[];
  loading: boolean;
  loadingBoards: boolean;
  queueingParcelId: string | null;
};

export type QueueAccess = {
  canView: boolean;
  canIssueTicket: boolean;
  canReadParcels: boolean;
  canReadReceiverBoard: boolean;
  canReadSenderBoard: boolean;
};
