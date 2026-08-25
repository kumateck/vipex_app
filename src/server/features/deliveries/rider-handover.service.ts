import { db } from '@/db/config';
import { ParcelStatus } from '@/db/schemas/enums';
import { getParcelRepo, updateParcelRepo } from '@/server/features/shipments/parcels.repository';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { toPesewas } from '@/server/utils/gh-money';
import { getDeliveryByParcelRepo, updateDeliveryRepo } from './repository';
import { hasPendingDeliveryChangeRequestRepo } from './delivery-change-request.repository';
import { getParcelPaymentSettlement } from '@/server/features/shipments/parcel-payment-settlement';

export type RiderHandoverInput = {
  parcelId: string;
  riderUserId: string;
  signatureImage: string;
  principalAmountCedis?: number | string | null;
  deliveryFeeAmountCedis?: number | string | null;
  secondReceiverId?: string | null;
  cardId?: string | null;
  cardNumber?: string | null;
  secondCardId?: string | null;
  secondCardNumber?: string | null;
};

function hasPositiveAmount(value: number | string | null | undefined) {
  return value !== null && value !== undefined && Number(value) > 0;
}

export async function doorToDoorRiderGivenToCustomerSvc(input: RiderHandoverInput) {
  return db.transaction(async (tx) => {
    const parcel = await getParcelRepo(input.parcelId, tx);
    if (!parcel) throw NotFound('Parcel not found');
    if (parcel.status !== ParcelStatus.DISPATCHED) {
      throw Conflict('Parcel is not dispatched');
    }

    const delivery = await getDeliveryByParcelRepo(input.parcelId, tx);
    if (!delivery) throw NotFound('Delivery not found');
    if (delivery.riderUserId !== input.riderUserId) {
      throw Conflict('Parcel is not assigned to this rider');
    }
    if (await hasPendingDeliveryChangeRequestRepo(delivery.id, tx)) {
      throw Conflict('Delivery address and fee change request is awaiting review');
    }

    const signatureImage = input.signatureImage.trim();
    if (!signatureImage) throw BadRequest('Signature is required');

    const collectPrincipal = hasPositiveAmount(input.principalAmountCedis);
    const collectDeliveryFee = hasPositiveAmount(input.deliveryFeeAmountCedis);
    const principalCollectedPsw = collectPrincipal
      ? Number(toPesewas(input.principalAmountCedis!))
      : 0;
    const deliveryFeeCollectedPsw = collectDeliveryFee
      ? Number(toPesewas(input.deliveryFeeAmountCedis!))
      : 0;
    const settlement = await getParcelPaymentSettlement(input.parcelId, tx);
    const outstandingPrincipalPsw = Math.max(
      Number(parcel.plannedToBePaidPsw ?? 0) - settlement.paidPrincipalPsw,
      0,
    );
    const outstandingDeliveryFeePsw = Math.max(
      settlement.requiredDeliveryFeePsw - settlement.paidDeliveryFeePsw,
      0,
    );
    if (principalCollectedPsw > outstandingPrincipalPsw) {
      throw BadRequest(
        `Rider collection exceeds the outstanding to-be-paid amount of ${(outstandingPrincipalPsw / 100).toFixed(2)} GHS`,
      );
    }
    if (deliveryFeeCollectedPsw > outstandingDeliveryFeePsw) {
      throw BadRequest(
        `Rider collection exceeds the outstanding delivery fee of ${(outstandingDeliveryFeePsw / 100).toFixed(2)} GHS`,
      );
    }

    const completedAt = new Date();
    await updateParcelRepo(
      input.parcelId,
      {
        status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
        secondReceiverId: input.secondReceiverId ?? parcel.secondReceiverId,
        cardId: input.cardId ?? parcel.cardId,
        cardNumber: input.cardNumber ?? parcel.cardNumber,
        secondCardId: input.secondCardId ?? parcel.secondCardId,
        secondCardNumber: input.secondCardNumber ?? parcel.secondCardNumber,
        confirmedBy: input.riderUserId,
        confirmedAt: completedAt,
      },
      tx,
    );
    await updateDeliveryRepo(
      delivery.id,
      {
        status: 'RIDER_GIVEN_PARCEL_TO_CUSTOMER',
        signatureImage,
        riderCollectedPrincipalPsw: principalCollectedPsw,
        riderCollectedDeliveryFeePsw: deliveryFeeCollectedPsw,
        riderCollectionRecordedAt: completedAt,
        riderCompletedAt: completedAt,
        confirmedBy: input.riderUserId,
        confirmedAt: completedAt,
        updatedAt: completedAt,
      },
      tx,
    );

    return { id: delivery.id };
  });
}
