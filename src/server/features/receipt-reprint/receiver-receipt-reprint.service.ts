import { listPaymentsForParcelRepo } from '../payments/repository';
import { getParcelSvc } from '../shipments/parcels.service';
import type { AuthUser } from '@/server/plugins/auth';
import { BadRequest, NotFound } from '@/server/utils/http-error';
import { summarizeReceiverReceiptPayments } from './receiver-receipt-payments';
import {
  canReadReceiverReceiptReprint,
  isReceiverReceiptReprintEligible,
} from './receiver-receipt-access';

export async function getReceiverReceiptReprintSvc(parcelId: string, user: AuthUser) {
  const parcel = await getParcelSvc(parcelId);
  if (!canReadReceiverReceiptReprint(user, parcel)) throw NotFound('Parcel not found');
  if (!isReceiverReceiptReprintEligible(parcel)) {
    throw BadRequest('Only delivered office parcels have a receiver cashier receipt');
  }
  const amounts = summarizeReceiverReceiptPayments(await listPaymentsForParcelRepo(parcelId));
  if (!amounts) throw BadRequest('Recorded receiver payment is unavailable');
  return {
    ...amounts,
    issuedAt: parcel.confirmedAt!.toISOString(),
    // Card evidence identifies a second-receiver handover when it was recorded.
    receivedByName:
      parcel.secondCardId || parcel.secondCardNumber
        ? parcel.secondReceiverNameSnapshot
        : parcel.receiverNameSnapshot,
  };
}
