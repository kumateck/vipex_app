import type { BatchHandoverWorkflow, BatchSelection } from './parcel-batch-handover';
import type { ParcelHandoverNoteIndicator } from './parcel-handover-note';
import type { ReceiverCashierSignature } from './receiver-cashier-signature';

export type BatchSignatureParcel = ParcelHandoverNoteIndicator & {
  id: string;
  bookingCode: string;
  trackingCode: string;
  receiverName: string;
  parcelDetails: string;
};

export type BatchSignatureRequest = BatchSelection & {
  requestId: string;
  locationId: string | null;
  requestedAt: string;
  parcels: BatchSignatureParcel[];
  capture?: { signature: ReceiverCashierSignature; capturedAt: string; capturedBy: string };
};

export type BatchSignatureRow = {
  id: string;
  requestId: string;
  workflow: BatchHandoverWorkflow;
  telephone: string;
  requestedAt: string;
  expiresAt: string;
  signedAt: string | null;
  parcels: BatchSignatureParcel[];
};

export type BatchSignaturePage = { rows: BatchSignatureRow[]; next: string | null };
export type BatchSignatureStatus = BatchSignatureRow & { signature?: ReceiverCashierSignature };
export type BatchSignaturePreparation = BatchSelection & { id: string; verificationToken: string };
