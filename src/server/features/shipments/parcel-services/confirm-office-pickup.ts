import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, customers, parcels, users } from '@/db/schemas';
import { ParcelStatus, UserStatus } from '@/db/schemas/enums';
import { isHandoverSignature } from '@/shared/shipments/handover-signature';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import {
  assertReceiverOtpVerifiedSvc,
  consumeReceiverOtpTokenSvc,
} from '../../parcel-receiver-otp/service';
import { getPickupQueueByParcelRepo } from '../../pickup-queues/repository';
import { endPickupQueueForParcelSvc } from '../../pickup-queues/service';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../parcel-delivery-reconciliation-guard';
import { assertParcelFullyPaid } from '../parcel-payment-settlement';
import { updateParcelRepo } from '../parcel-repositories/parcel-records.repository';
import { assertNoOutstandingStorageForHandover } from '../storage-accrual-guards';
import { getParcelStorageSettlementSvc } from './storage';

export async function confirmOfficePickupSvc(input: {
  parcelId: string;
  companyId: string;
  branchId: string;
  locationId?: string | null;
  actorUserId: string;
  confirmedBy: string;
  handoverTarget: 'main' | 'second';
  signatureImage: string;
  expectedMainReceiverId: string;
  expectedSecondReceiverId: string | null;
  secondReceiverId: string | null;
  cardId: string | null;
  cardNumber: string | null;
  secondCardId: string | null;
  secondCardNumber: string | null;
  receiverOtpVerificationToken?: string;
}) {
  if (!isHandoverSignature(input.signatureImage))
    throw BadRequest('A valid collector signature is required');
  const { parcelId, companyId, branchId, handoverTarget } = input;
  const result = await db.transaction(async (tx) => {
    const [parcel] = await tx
      .select()
      .from(parcels)
      .where(
        and(
          eq(parcels.id, parcelId),
          eq(parcels.companyId, companyId),
          eq(parcels.destinationId, branchId),
          eq(parcels.isDeleted, false),
        ),
      )
      .for('update');
    if (!parcel) throw NotFound('Parcel not found at this branch');
    if (parcel.pendingReceiverHandover)
      throw Conflict('This parcel is awaiting a Receiver Cashier signature');
    if (parcel.status !== ParcelStatus.AWAITING_PICKUP || parcel.confirmedAt) {
      throw Conflict('Parcel is no longer awaiting pickup');
    }

    const [branch] = await tx
      .select({
        requirePickupOtp: branches.requirePickupOtp,
        usePickupQueue: branches.usePickupQueue,
      })
      .from(branches)
      .where(
        and(
          eq(branches.id, branchId),
          eq(branches.companyId, companyId),
          eq(branches.isDeleted, false),
        ),
      );
    if (!branch) throw NotFound('Destination branch not found');
    const queue = await getPickupQueueByParcelRepo(parcelId, tx);
    if (branch.usePickupQueue && queue?.branchId !== branchId) {
      throw Conflict('Create a pickup queue ticket for this parcel before handover');
    }
    const assignedPicker = parcel.shelfPickerStaffId ?? queue?.pickerStaffId;
    if (assignedPicker) {
      if (assignedPicker !== input.confirmedBy)
        throw Conflict('Shelf picker changed; reopen the parcel');
    } else {
      if (!input.locationId)
        throw BadRequest('An assigned location is required to select shelf picker staff');
      const [picker] = await tx
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.id, input.confirmedBy),
            eq(users.status, UserStatus.ACTIVE),
            eq(users.companyId, companyId),
            eq(users.branchId, branchId),
            eq(users.locationId, input.locationId),
          ),
        );
      if (!picker) throw BadRequest('Select active shelf picker staff at your location');
    }

    const isSecond = handoverTarget === 'second';
    if (
      parcel.receiverId !== input.expectedMainReceiverId ||
      (isSecond && parcel.secondReceiverId !== input.expectedSecondReceiverId)
    ) {
      throw Conflict('Receiver changed; reopen the parcel and capture a fresh signature');
    }
    const secondReceiverId = isSecond
      ? (parcel.secondReceiverId ?? input.secondReceiverId)
      : parcel.secondReceiverId;
    const customerId = isSecond ? secondReceiverId : parcel.receiverId;
    if (!customerId || (isSecond && customerId === parcel.receiverId)) {
      throw BadRequest('Select a valid collector');
    }
    const [collector] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.companyId, companyId),
          eq(customers.isDeleted, false),
        ),
      );
    if (!collector) throw BadRequest('Collector is no longer available');

    await assertNoOpenParcelReconciliationCaseForDelivery(parcelId, tx);
    await assertParcelFullyPaid(parcelId, tx);
    const storage = await getParcelStorageSettlementSvc(parcelId, tx);
    assertNoOutstandingStorageForHandover(storage.outstandingPsw);
    if (branch.requirePickupOtp) {
      if (!input.receiverOtpVerificationToken)
        throw BadRequest('Verify the customer collection OTP before handover');
      const otp = await assertReceiverOtpVerifiedSvc(
        {
          parcelId,
          targetReceiver: 'main',
          verificationToken: input.receiverOtpVerificationToken,
        },
        tx,
      );
      await consumeReceiverOtpTokenSvc(otp.id, tx);
    }

    await updateParcelRepo(
      parcelId,
      {
        status: ParcelStatus.DELIVERED_BY_OFFICE,
        confirmedAt: new Date(),
        confirmedBy: input.confirmedBy,
        secondReceiverId,
        cardId: input.cardId,
        cardNumber: input.cardNumber,
        secondCardId: isSecond ? input.secondCardId : null,
        secondCardNumber: isSecond ? input.secondCardNumber : null,
        deliveryConfirmationSnapshot: {
          parcelStatus: parcel.status,
          confirmedAt: null,
          confirmedBy: parcel.confirmedBy,
          plannedToBePaidPsw: parcel.plannedToBePaidPsw,
          paymentIds: [],
          creditChargeIds: [],
          pickupQueueId: queue?.id ?? null,
          handover: {
            secondReceiverId: parcel.secondReceiverId,
            secondReceiverNameSnapshot: parcel.secondReceiverNameSnapshot,
            cardId: parcel.cardId,
            cardNumber: parcel.cardNumber,
            secondCardId: parcel.secondCardId,
            secondCardNumber: parcel.secondCardNumber,
          },
          delivery: null,
          officePickupSignature: {
            signatureImage: input.signatureImage,
            handoverTarget,
            customerId,
            capturedBy: input.actorUserId,
          },
        },
      },
      tx,
    );
    await endPickupQueueForParcelSvc({ parcelId, endedBy: input.actorUserId }, tx);
    return { trackingCode: parcel.trackingCode, customerId };
  });

  await recordAuditLog({
    companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: parcelId,
    action: 'PARCEL_UPDATED',
    message: `Signed office pickup for ${result.trackingCode}`,
    metadata: {
      patch: { status: ParcelStatus.DELIVERED_BY_OFFICE },
      previous: { status: ParcelStatus.AWAITING_PICKUP },
      signatureCaptured: true,
      handoverTarget,
      customerId: result.customerId,
    },
  });
  return { id: parcelId };
}
