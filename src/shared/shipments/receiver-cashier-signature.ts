import { isHandoverSignature, MAX_HANDOVER_SIGNATURE_LENGTH } from './handover-signature';
import type { ParcelHandoverNoteIndicator } from './parcel-handover-note';
import type { ParcelReceivingOffice } from './receiving-office';

export type ReceiverCashierSignature =
  | { source: 'touchscreen'; signatureImage: string }
  | { source: 'topaz'; signatureImage: string; sigString: string };

export type PendingReceiverHandoverRow = ParcelHandoverNoteIndicator &
  ParcelReceivingOffice & {
    id: string;
    handoverId: string;
    trackingCode: string;
    bookingCode: string;
    collectorName: string;
    associateName: string;
    requestedAt: string;
    signedAt: string | null;
    receiverId: string;
  };

export type ReceiverHandoverWatchKey = { parcelId: string; handoverId?: string };
export type ReceiverHandoverListQuery = Partial<ReceiverHandoverWatchKey> & {
  after?: string;
  search?: string;
  since?: string;
};
export type ReceiverHandoverPage = {
  rows: PendingReceiverHandoverRow[];
  next: string | null;
  revision: string;
};

export function isReceiverCashierSignature(signature: ReceiverCashierSignature) {
  if (signature.source === 'touchscreen')
    return isHandoverSignature(signature.signatureImage, true);
  const png = signature.signatureImage;
  return (
    png.length <= MAX_HANDOVER_SIGNATURE_LENGTH &&
    /^data:image\/png;base64,iVBORw0KGgoAAAANSUhEUg[A-Za-z0-9+/]+={0,2}$/.test(png) &&
    signature.sigString.length <= MAX_HANDOVER_SIGNATURE_LENGTH &&
    /^(?:[0-9a-f]{2}){8,}$/i.test(signature.sigString)
  );
}
