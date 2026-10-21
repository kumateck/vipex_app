import { getSelfServiceStickerPayment } from '@/shared/self-service';
import type { ReceiptPrintData } from '@/features/operations/parcel/components/parcel-sticker-actions';
import type {
  CompleteSelfServiceDraftInput,
  CompleteSelfServiceDraftResponse,
  SelfServiceDraft,
} from '../api/self-service-agent.api';

export function buildSelfServiceCompletionReceipt({
  draft,
  input,
  response,
  destinationBranchName,
  destinationLocationName,
}: {
  draft: SelfServiceDraft;
  input: CompleteSelfServiceDraftInput;
  response: CompleteSelfServiceDraftResponse;
  destinationBranchName: string;
  destinationLocationName: string;
}): ReceiptPrintData | null {
  const parcel = response.parcels[0];
  if (!parcel) return null;
  const payment = getSelfServiceStickerPayment(input);
  return {
    bookingCode: parcel.bookingCode,
    trackingCode: parcel.trackingCode,
    parcelDetails: input.parcelDetails,
    parcelContent: draft.parcelContent,
    callSender: input.callSender ?? draft.callSender,
    senderName: draft.senderFullname,
    senderTelephone: draft.senderPhone,
    senderTelephone2: draft.senderPhone2,
    receiverName: draft.receiverFullname,
    receiverTelephone: draft.receiverPhone,
    receiverTelephone2: draft.receiverPhone2,
    destinationBranchName,
    destinationLocationName,
    totalChargeCedis: Number(input.chargeCedis),
    senderPaidCedis: 0,
    receiverToPayCedis: payment.receiverToPayCedis,
    issuedAt: new Date().toISOString(),
  };
}
