import { mobileApiGet } from '@mobile/lib/api';
import type { ParcelSearchRow } from '@mobile/types/parcels';

export type NoteQueue = 'call-center' | 'shelf-picker' | 'receiver-cashier-queue';

export function listNoteParcels(token: string, queue: NoteQueue, search: string, page: number) {
  return mobileApiGet<{ data: ParcelSearchRow[]; meta: { hasNextPage: boolean } }>({
    path: `/shipments/parcels/${queue}`,
    token,
    query: { search, page, pageSize: 20 },
  });
}
