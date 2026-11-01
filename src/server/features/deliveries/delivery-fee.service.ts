import { assertParcelCanAccrueCharge } from '../shipments/charge-exemption';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, deliveries, users } from '@/db/schemas';
import { DeliveryMode, UserStatus, UserType } from '@/db/schemas/enums';
import { BadRequest, Conflict, Forbidden } from '@/server/utils/http-error';
import { toPesewas } from '@/server/utils/gh-money';
import { getDeliveryFeeInputError } from '@/shared/shipments/delivery-fee';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../shipments/parcel-delivery-reconciliation-guard';
import { getDeliveryFeeContextRepo, type DeliveryFeeScope } from './delivery-fee.repository';

type FeeActorInput = DeliveryFeeScope & { actorUserId: string };
type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getEditableContext(input: FeeActorInput, tx: Executor) {
  const [actor] = await tx
    .select({ userType: users.userType })
    .from(users)
    .where(
      and(
        eq(users.id, input.actorUserId),
        eq(users.companyId, input.companyId),
        eq(users.branchId, input.branchId),
        eq(users.status, UserStatus.ACTIVE),
      ),
    );
  if (!actor || actor.userType === UserType.RIDER) {
    throw Forbidden('Only active branch staff can edit delivery fees; riders must request review');
  }
  const context = await getDeliveryFeeContextRepo(input, tx);
  if (context.delivery.mode !== DeliveryMode.DOORSTEP) throw Conflict('Not a doorstep delivery');
  if (context.delivery.changeRequestStatus === 'PENDING') {
    throw Conflict('Review the pending delivery change request before editing its fee');
  }
  await assertNoOpenParcelReconciliationCaseForDelivery(input.parcelId, tx);
  return context;
}

export async function getDeliveryFeeSvc(input: FeeActorInput) {
  return db.transaction(async (tx) => {
    const { parcel, delivery, paidFeePsw } = await getEditableContext(input, tx);
    return {
      parcelId: parcel.id,
      bookingCode: parcel.bookingCode,
      chargePsw: delivery.chargePsw,
      paidFeePsw,
      riderCollectedFeePsw: delivery.riderCollectedDeliveryFeePsw,
      updatedAt: delivery.updatedAt.toISOString(),
    };
  });
}

export async function updateDeliveryFeeSvc(
  input: FeeActorInput & {
    deliveryFeeCedis: string | number;
    expectedChargePsw: number;
    expectedUpdatedAt: string;
    reason: string;
  },
) {
  const fee = String(input.deliveryFeeCedis).trim();
  const validationError = getDeliveryFeeInputError(fee);
  if (validationError) throw BadRequest(validationError);
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 500)
    throw BadRequest('Enter a reason of 3 to 500 characters');
  const chargePsw = Number(toPesewas(fee));
  const result = await db.transaction(async (tx) => {
    const { parcel, delivery, paidFeePsw } = await getEditableContext(input, tx);
    assertParcelCanAccrueCharge(parcel, chargePsw);
    if (
      delivery.chargePsw !== input.expectedChargePsw ||
      delivery.updatedAt.toISOString() !== input.expectedUpdatedAt
    ) {
      throw Conflict('Delivery changed; reload the fee and review it again');
    }
    if (chargePsw < Math.max(paidFeePsw, delivery.riderCollectedDeliveryFeePsw)) {
      throw BadRequest(
        'Delivery fee cannot be less than payments or the recorded rider collection',
      );
    }
    if (chargePsw === delivery.chargePsw)
      return { id: delivery.id, chargePsw, changed: false, riderUserId: delivery.riderUserId };
    await tx
      .update(deliveries)
      .set({ chargePsw, updatedAt: new Date() })
      .where(eq(deliveries.id, delivery.id));
    await tx.insert(auditLogs).values({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'delivery',
      entityId: delivery.id,
      action: 'DELIVERY_FEE_UPDATED',
      message: `Delivery fee updated for ${parcel.bookingCode}`,
      metadata: {
        parcelId: parcel.id,
        bookingCode: parcel.bookingCode,
        previousChargePsw: delivery.chargePsw,
        chargePsw,
        reason,
      },
    });
    return { id: delivery.id, chargePsw, changed: true, riderUserId: delivery.riderUserId };
  });
  return { id: result.id, chargePsw: result.chargePsw, changed: result.changed };
}
