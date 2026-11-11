import { mobileApiGet, mobileApiPatch } from '@mobile/lib/api';
import type { ParcelHandoverNote } from '../types';
export { listNoteParcels, type NoteQueue } from './list-note-parcels';

export function getHandoverNote(token: string, id: string) {
  return mobileApiGet<ParcelHandoverNote>({
    path: `/shipments/parcels/${id}/handover-note`,
    token,
  });
}

export function saveHandoverNote(
  token: string,
  id: string,
  body: { note: string; expectedNote: string | null },
) {
  return mobileApiPatch<ParcelHandoverNote>({
    path: `/shipments/parcels/${id}/handover-note`,
    token,
    body,
  });
}
