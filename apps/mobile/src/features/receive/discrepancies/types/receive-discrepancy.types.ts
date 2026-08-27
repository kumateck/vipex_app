export type DiscrepancyType = 'record_not_physical' | 'physical_missing_in_system';

export type OpenParcelDiscrepancy = {
  id: string;
  parcelId: string | null;
  trackingCode: string | null;
  bookingCode: string | null;
  discrepancyType: string;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
  senderName: string | null;
  receiverName: string | null;
};

export type DiscrepancyPhoto = { path: string; dataUrl: string; fileName: string };
