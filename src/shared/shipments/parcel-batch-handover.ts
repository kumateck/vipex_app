import type { ParcelHandoverNoteIndicator } from './parcel-handover-note';
import type { ReceiverCashierSignature } from './receiver-cashier-signature';

export const MAX_BATCH_PARCELS = 20;
export const BATCH_OTP_RESEND_SECONDS = 60;

export type BatchHandoverWorkflow = 'office-pickup' | 'receiver-cashier';
export type BatchHandoverChannel = 'sms' | 'whatsapp';
export const BATCH_PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'telecel', label: 'Telecel' },
  { value: 'airtel', label: 'Airtel' },
] as const;
export type BatchPaymentMethod = (typeof BATCH_PAYMENT_METHODS)[number]['value'];

export type BatchParcelQuote = {
  id: string;
  receiverId: string;
  principalPsw: number;
  storagePsw: number;
};

export type BatchPickupParcel = BatchParcelQuote &
  ParcelHandoverNoteIndicator & {
    trackingCode: string;
    bookingCode: string;
    receiverName: string;
    parcelDetails: string;
    queueNumber: number | null;
    needsAssociate: boolean;
    pickupLocationName: string | null;
    receivingOfficeName: string | null;
    blockedReason: string | null;
  };

export type BatchPickupPage = {
  rows: BatchPickupParcel[];
  next: string | null;
  staff: { id: string; name: string }[];
};

export type BatchSelection = { telephone: string; items: BatchParcelQuote[] };
export type BatchOtpRequest = BatchSelection & { channel: BatchHandoverChannel };
export type BatchOtpSession = { id: string; expiresAt: string; resendAt: string };
export type BatchOtpVerify = { id: string; otp: string };
export type BatchOtpProof = { verificationToken: string; expiresAt: string };
export type BatchConfirmation = BatchSelection & {
  id: string;
  verificationToken: string;
  signature: ReceiverCashierSignature;
  associateId?: string;
  paymentMethod?: BatchPaymentMethod;
};

export function normalizeBatchTelephone(value: string) {
  const digits = value.replace(/\D/g, '');
  return /^233[0-9]{9}$/.test(digits) ? `0${digits.slice(3)}` : digits;
}
