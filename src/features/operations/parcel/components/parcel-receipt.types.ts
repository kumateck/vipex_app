import type { StickerPaymentStatus, VerifiedStickerPayment } from '@/shared/printing';

export type ReceiptPrintData = {
  bookingCode: string;
  trackingCode: string;
  callSender?: boolean;
  stickerStatusLabel?: StickerPaymentStatus;
  settlementMode?: 'CREDIT';
  /** Supplied only after a successful cashier collect/confirm request. */
  confirmedStickerPayment?: VerifiedStickerPayment;
  parcelDetails: string;
  parcelContent?: string | null;
  parcelValueCedis?: number | null;
  receivedByName?: string | null;
  payerType?: 'sender' | 'receiver';
  payerName?: string;
  payerTelephone?: string;
  payerTelephone2?: string | null;
  senderName: string;
  senderTelephone: string;
  senderTelephone2?: string | null;
  receiverName: string;
  receiverTelephone: string;
  receiverTelephone2?: string | null;
  destinationBranchName: string;
  destinationLocationName: string;
  totalChargeCedis: number;
  senderPaidCedis: number;
  receiverToPayCedis: number;
  amountPaidCedis?: number;
  storageChargeCedis?: number;
  issuedAt: string;
  taxBreakdown?: {
    vatCedis: number;
    getfundCedis: number;
    nhilCedis: number;
    covidCedis?: number;
    taxTotalCedis: number;
    taxComponentKeys?: string[];
  };
};
