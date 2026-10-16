export type ParcelHistoryCategory =
  | 'created'
  | 'status'
  | 'custody'
  | 'payment'
  | 'delivery'
  | 'storage'
  | 'exception'
  | 'communication'
  | 'edit'
  | 'print';

export type ParcelHistoryEvent = {
  id: string;
  occurredAt: string;
  category: ParcelHistoryCategory;
  title: string;
  description: string | null;
  actorName: string | null;
  branchName: string | null;
};

export type ParcelDetailsTab =
  | 'overview'
  | 'people'
  | 'payments'
  | 'delivery'
  | 'custody'
  | 'storage'
  | 'handled-by'
  | 'history'
  | 'actions';
