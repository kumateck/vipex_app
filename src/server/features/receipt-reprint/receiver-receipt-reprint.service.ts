import type { DeliveryConfirmationSnapshot } from '@/shared/shipments/delivery-confirmation-snapshot';
import { db } from '@/db/config';
import { parcels } from '@/db/schemas';
import { eq, sql } from 'drizzle-orm';
import { listPaymentsForParcelRepo } from '../payments/repository';
import { getParcelSvc, listParcelsSvc } from '../shipments/parcels.service';
import type { AuthUser } from '@/server/plugins/auth';
import { BadRequest, NotFound } from '@/server/utils/http-error';
import { summarizeReceiverReceiptPayments } from './receiver-receipt-payments';
import {
  canReadReceiverReceiptReprint,
  isReceiverReceiptReprintEligible,
} from './receiver-receipt-access';

export async function getReceiverReceiptReprintSvc(
  parcelId: string,
  user: AuthUser,
  includeParcel = false,
) {
  const parcel = await getParcelSvc(parcelId);
  if (!canReadReceiverReceiptReprint(user, parcel)) throw NotFound('Parcel not found');
  if (!isReceiverReceiptReprintEligible(parcel)) {
    throw BadRequest('Only delivered office parcels have a receiver cashier receipt');
  }
  const [payments, [signedHandover], summary] = await Promise.all([
    listPaymentsForParcelRepo(parcelId),
    db
      .select({
        receiptTax: sql<
          DeliveryConfirmationSnapshot['receiverCashierReceiptTax'] | null
        >`${parcels.deliveryConfirmationSnapshot}->'receiverCashierReceiptTax'`,
        collectorName: sql<
          string | null
        >`${parcels.deliveryConfirmationSnapshot}->'receiverCashierSignature'->>'collectorName'`,
      })
      .from(parcels)
      .where(eq(parcels.id, parcelId)),
    includeParcel
      ? listParcelsSvc({
          parcelId,
          companyId: parcel.companyId,
          destinationId: parcel.destinationId,
          limit: 1,
          offset: 0,
        }).then(({ data }) => data[0])
      : undefined,
  ]);
  const amounts = summarizeReceiverReceiptPayments(payments);
  if (!amounts) throw BadRequest('Recorded receiver payment is unavailable');
  return {
    ...amounts,
    ...signedHandover?.receiptTax,
    ...(summary
      ? {
          parcel: {
            chargeExemptCustomerType: summary.chargeExemptCustomerType,
            relatedStaffNameSnapshot: summary.relatedStaffNameSnapshot,
            bookingCode: summary.bookingCode,
            trackingCode: summary.trackingCode,
            callSender: summary.callSender,
            parcelDetails: summary.parcelDetails,
            parcelContent: summary.parcelContent,
            parcelValuePsw: summary.parcelValuePsw,
            senderName: summary.senderName,
            senderPhone: summary.senderPhone,
            senderPhone2: summary.senderPhone2,
            receiverName: summary.receiverName,
            receiverPhone: summary.receiverPhone,
            receiverPhone2: summary.receiverPhone2,
            destinationName: summary.destinationName,
            pickupLocationName: summary.pickupLocationName,
            chargePsw: summary.chargePsw,
          },
        }
      : {}),
    issuedAt: parcel.confirmedAt!.toISOString(),
    // Card evidence identifies a second-receiver handover when it was recorded.
    receivedByName:
      signedHandover?.collectorName ??
      (parcel.secondCardId || parcel.secondCardNumber
        ? parcel.secondReceiverNameSnapshot
        : parcel.receiverNameSnapshot),
  };
}
