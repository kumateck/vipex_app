export const MAX_PARCEL_HANDOVER_NOTE_LENGTH = 1000;

export type ParcelHandoverNoteIndicator = {
  hasHandoverNote?: boolean;
  handoverNoteCritical?: boolean;
};

export type ParcelHandoverNote = {
  note: string | null;
  critical: boolean;
  canEdit: boolean;
};
