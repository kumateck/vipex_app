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

/** A history entry before user and branch ids are resolved to names. */
export type ParcelHistoryDraft = {
  id: string;
  occurredAt: Date;
  category: ParcelHistoryCategory;
  title: string;
  description?: string | null;
  actorId?: string | null;
  branchId?: string | null;
  /** A second person named in the entry, e.g. the assigned rider or picker. */
  subject?: { label: string; userId: string | null | undefined } | null;
};

export type ParcelHistoryEvent = {
  id: string;
  occurredAt: string;
  category: ParcelHistoryCategory;
  title: string;
  description: string | null;
  actorName: string | null;
  branchName: string | null;
};
