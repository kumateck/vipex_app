import { fromPesewas, toPesewas } from '@/server/utils/gh-money';
import { ParcelStatus, PaymentMethod } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '../../../utils/http-error';
import { getBranchRepo } from '../../branches/repository';
import { recordAuditLog } from '../../audit/logger';
import { endPickupQueueForParcelSvc } from '../../pickup-queues/service';
import {
  assertReceiverOtpVerifiedSvc,
  consumeReceiverOtpTokenSvc,
} from '../../parcel-receiver-otp/service';
import { getParcelRepo, updateParcelRepo } from '../parcels.repository';
import { assertParcelFullyPaid } from '../parcel-payment-settlement';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../parcel-delivery-reconciliation-guard';
import { assertNoOutstandingStorageForHandover } from '../storage-accrual-guards';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import { getParcelStorageSettlementSvc } from './storage';
import { markParcelReceivedSvc } from './receive';
import { resolveReceivingPickupLocationsRepo } from '../../locations';

export async function updateParcelSvc(
  id: string,
  patch: {
    status?: number;
    destinationId?: string;
    sourceLocationId?: string | null;
    parcelDetails?: string;
    parcelContent?: string;
    secondReceiverId?: string | null;
    cardId?: string | null;
    cardNumber?: string | null;
    secondCardId?: string | null;
    secondCardNumber?: string | null;
    confirmedBy?: string | null;
    confirmedAt?: string | null;
    parcelValueCedis?: number | string | null;
    chargeCedis?: number | string | null;
    pickupLocationId?: string | null;
    method?: number;
    taxReportConfirmation?: boolean;
    receiverOtpVerificationToken?: string;
    receiverOtpTarget?: 'main' | 'second';
  },
  actorUserId?: string | null,
): Promise<{ id: string }> {
  if (patch.status === ParcelStatus.ARRIVED_AT_DESTINATION) {
    if (!actorUserId || Object.keys(patch).some((key) => key !== 'status'))
      throw BadRequest('Confirm arrival separately from parcel edits');
    await markParcelReceivedSvc(id, { receivedBy: actorUserId, status: patch.status });
    return { id };
  }
  const cur = await getParcelRepo(id);
  if (!cur) throw NotFound('Parcel not found');
  if (
    patch.status === ParcelStatus.RETURN_TO_SOURCE &&
    cur.status !== ParcelStatus.RETURN_TO_SOURCE
  ) {
    throw BadRequest('Use the destination branch return action to record a return to source');
  }
  if (
    cur.status === ParcelStatus.RETURN_TO_SOURCE &&
    patch.status !== undefined &&
    patch.status !== ParcelStatus.RETURN_TO_SOURCE
  ) {
    throw Conflict('Parcel is marked for return to its source branch');
  }
  let verifiedReceiverOtp: Awaited<ReturnType<typeof assertReceiverOtpVerifiedSvc>> | null = null;
  if (
    patch.status === ParcelStatus.DELIVERED_BY_OFFICE ||
    patch.status === ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER ||
    patch.status === ParcelStatus.DELIVERED_AT_HOME
  ) {
    await assertNoOpenParcelReconciliationCaseForDelivery(id);
  }
  if (patch.status === ParcelStatus.DELIVERED_BY_OFFICE) {
    const destinationBranch = await getBranchRepo(cur.destinationId);
    if (!destinationBranch) throw NotFound('Destination branch not found');
    if (destinationBranch.requirePickupOtp) {
      if (!patch.receiverOtpVerificationToken || !patch.receiverOtpTarget) {
        throw BadRequest('Receiver OTP verification is required before office pickup');
      }
      verifiedReceiverOtp = await assertReceiverOtpVerifiedSvc({
        parcelId: id,
        targetReceiver: patch.receiverOtpTarget,
        verificationToken: patch.receiverOtpVerificationToken,
      });
    }
    await assertParcelFullyPaid(id);
    const storageSettlement = await getParcelStorageSettlementSvc(id);
    assertNoOutstandingStorageForHandover(storageSettlement.outstandingPsw);
  }
  const setPatch: Partial<typeof cur> & { parcelValuePsw?: number } = {};
  if (patch.status !== undefined) setPatch.status = patch.status;
  if (patch.destinationId !== undefined) setPatch.destinationId = patch.destinationId;
  if (patch.sourceLocationId !== undefined) setPatch.sourceLocationId = patch.sourceLocationId;
  if (patch.parcelDetails) setPatch.parcelDetails = patch.parcelDetails;
  if (patch.parcelContent) setPatch.parcelContent = patch.parcelContent;
  if (patch.secondReceiverId !== undefined) setPatch.secondReceiverId = patch.secondReceiverId;
  if (patch.cardId !== undefined) setPatch.cardId = patch.cardId;
  if (patch.cardNumber !== undefined) setPatch.cardNumber = patch.cardNumber;
  if (patch.secondCardId !== undefined) setPatch.secondCardId = patch.secondCardId;
  if (patch.secondCardNumber !== undefined) setPatch.secondCardNumber = patch.secondCardNumber;
  if (patch.confirmedBy !== undefined) setPatch.confirmedBy = patch.confirmedBy;
  if (patch.confirmedAt !== undefined) {
    setPatch.confirmedAt = patch.confirmedAt ? new Date(patch.confirmedAt) : null;
  } else if (patch.status === ParcelStatus.DELIVERED_BY_OFFICE && !cur.confirmedAt) {
    setPatch.confirmedAt = new Date();
  }
  if (patch.parcelValueCedis !== undefined)
    setPatch.parcelValuePsw =
      patch.parcelValueCedis != null ? Number(toPesewas(patch.parcelValueCedis)) : 0;
  if (
    (cur.method === PaymentMethod.CREDIT || cur.chargePsw === 0) &&
    (patch.chargeCedis !== undefined || (patch.method !== undefined && patch.method !== cur.method))
  ) {
    throw Conflict(
      'Zero-charge and credit corrections require the dedicated charge approval workflow',
    );
  }
  if (patch.chargeCedis !== undefined) {
    const chargeValidationError = getParcelChargeValidationError({
      chargeCedis: patch.chargeCedis == null ? 0 : Number(patch.chargeCedis),
      plannedToBePaidCedis: fromPesewas(BigInt(cur.plannedToBePaidPsw)),
    });
    if (chargeValidationError) throw BadRequest(chargeValidationError);
    setPatch.chargePsw = Number(toPesewas(patch.chargeCedis!));
  }
  if (patch.pickupLocationId !== undefined) setPatch.pickupLocationId = patch.pickupLocationId;
  if (patch.destinationId !== undefined || patch.pickupLocationId !== undefined) {
    const [location] = await resolveReceivingPickupLocationsRepo(cur.companyId, [
      {
        destinationId: patch.destinationId ?? cur.destinationId,
        pickupLocationId:
          patch.pickupLocationId !== undefined
            ? patch.pickupLocationId
            : patch.destinationId !== cur.destinationId
              ? null
              : cur.pickupLocationId,
      },
    ]);
    setPatch.pickupLocationId = location!.pickupLocationId;
  }
  if (patch.method !== undefined) setPatch.method = patch.method;
  if (patch.taxReportConfirmation !== undefined)
    setPatch.taxReportConfirmation = patch.taxReportConfirmation;

  const updated = await updateParcelRepo(id, setPatch);
  if (!updated) throw NotFound('Parcel not found');

  await recordAuditLog({
    companyId: cur.companyId,
    actorUserId: actorUserId ?? null,
    entityType: 'parcel',
    entityId: id,
    action: 'PARCEL_UPDATED',
    message: `Parcel ${cur.trackingCode} updated`,
    metadata: {
      patch: {
        ...patch,
        receiverOtpVerificationToken: patch.receiverOtpVerificationToken ? '[REDACTED]' : undefined,
      },
      previous: {
        destinationId: cur.destinationId,
        pickupLocationId: cur.pickupLocationId,
        status: cur.status,
      },
    },
  });

  const shouldEndPickupQueue =
    cur.status === ParcelStatus.AWAITING_PICKUP &&
    patch.status !== undefined &&
    patch.status !== ParcelStatus.AWAITING_PICKUP;
  if (shouldEndPickupQueue) {
    await endPickupQueueForParcelSvc({ parcelId: id, endedBy: patch.confirmedBy ?? null });
  }
  if (verifiedReceiverOtp) {
    await consumeReceiverOtpTokenSvc(verifiedReceiverOtp.id);
  }
  return { id: updated.id };
}
