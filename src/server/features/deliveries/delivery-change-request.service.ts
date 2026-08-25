import { db } from '@/db/config';
import { DeliveryMode, ParcelStatus } from '@/db/schemas/enums';
import { recordAuditLog } from '@/server/features/audit/logger';
import { toPesewas } from '@/server/utils/gh-money';
import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import {
  decidePendingDeliveryChangeRequestRepo,
  getDeliveryChangeContextByIdRepo,
  getDeliveryChangeContextByParcelRepo,
  listPendingDeliveryChangesForBranchRepo,
  listPendingDeliveryChangesForRiderRepo,
  updateDeliveryChangeRequestRepo,
} from './delivery-change-request.repository';

export async function requestDeliveryChangeSvc(input: {
  parcelId: string;
  riderUserId: string;
  requestedDropoffAddress: string;
  requestedDeliveryFeeCedis: number | string;
  reason: string;
}) {
  const context = await getDeliveryChangeContextByParcelRepo(input.parcelId);
  if (!context) throw NotFound('Delivery not found');
  if (context.mode !== DeliveryMode.DOORSTEP) throw Conflict('Not a doorstep delivery');
  if (context.parcelStatus !== ParcelStatus.DISPATCHED) {
    throw Conflict('Only dispatched deliveries can be changed');
  }
  if (context.riderUserId !== input.riderUserId) {
    throw Forbidden('Delivery is not assigned to this rider');
  }
  if (context.status === 'PENDING') throw Conflict('A delivery change request is already pending');

  const address = input.requestedDropoffAddress.trim();
  const reason = input.reason.trim();
  const feeInput = String(input.requestedDeliveryFeeCedis).trim();
  if (!feeInput) throw BadRequest('Enter the new delivery fee');
  const feeCedis = Number(feeInput);
  const feeValidationError = getParcelChargeValidationError({
    chargeCedis: feeCedis,
    plannedToBePaidCedis: 0,
  });
  if (feeValidationError) throw BadRequest(feeValidationError);
  const chargePsw = Number(toPesewas(feeCedis));
  if (address.length < 3) throw BadRequest('Enter the new delivery address');
  if (reason.length < 3) throw BadRequest('Enter a reason for the change');
  if (chargePsw < 0) throw BadRequest('Delivery fee cannot be negative');
  if (address === context.currentDropoffAddress?.trim() && chargePsw === context.currentChargePsw) {
    throw BadRequest('The address and delivery fee have not changed');
  }

  await updateDeliveryChangeRequestRepo(context.deliveryId, {
    changeRequestStatus: 'PENDING',
    requestedDropoffAddress: address,
    requestedChargePsw: chargePsw,
    changeRequestReason: reason,
    changeRequestedBy: input.riderUserId,
    changeRequestedAt: new Date(),
    changeReviewedBy: null,
    changeReviewedAt: null,
    changeReviewNote: null,
    updatedAt: new Date(),
  });
  await recordAuditLog({
    companyId: context.companyId,
    actorUserId: input.riderUserId,
    entityType: 'delivery',
    entityId: context.deliveryId,
    action: 'DELIVERY_CHANGE_REQUESTED',
    message: 'Rider requested a delivery address and fee change',
    metadata: { address, chargePsw, reason, parcelId: input.parcelId },
  });
  return { id: context.deliveryId };
}

export const listRiderPendingDeliveryChangesSvc = (riderUserId: string) =>
  listPendingDeliveryChangesForRiderRepo(riderUserId);

export const listBranchPendingDeliveryChangesSvc = (branchId: string) =>
  listPendingDeliveryChangesForBranchRepo(branchId);

export async function decideDeliveryChangeSvc(input: {
  deliveryId: string;
  branchId: string;
  reviewerUserId: string;
  decision: 'APPROVED' | 'REJECTED';
  reviewNote?: string | null;
}) {
  const context = await getDeliveryChangeContextByIdRepo(input.deliveryId);
  if (!context) throw NotFound('Delivery change request not found');
  if (context.branchId !== input.branchId) throw Forbidden('Request belongs to another branch');
  if (context.status !== 'PENDING') throw Conflict('Delivery change request is not pending');
  if (context.requestedDropoffAddress === null || context.requestedChargePsw === null) {
    throw Conflict('Delivery change request is incomplete');
  }
  const requestedDropoffAddress = context.requestedDropoffAddress;
  const requestedChargePsw = context.requestedChargePsw;

  await db.transaction(async (tx) => {
    const approved = input.decision === 'APPROVED';
    const updated = await decidePendingDeliveryChangeRequestRepo(
      context.deliveryId,
      {
        ...(approved
          ? {
              dropoffAddress: requestedDropoffAddress,
              chargePsw: requestedChargePsw,
            }
          : {}),
        changeRequestStatus: input.decision,
        changeReviewedBy: input.reviewerUserId,
        changeReviewedAt: new Date(),
        changeReviewNote: input.reviewNote?.trim() || null,
        updatedAt: new Date(),
      },
      tx,
    );
    if (!updated) throw Conflict('Delivery change request has already been reviewed');
  });
  await recordAuditLog({
    companyId: context.companyId,
    actorUserId: input.reviewerUserId,
    entityType: 'delivery',
    entityId: context.deliveryId,
    action: `DELIVERY_CHANGE_${input.decision}`,
    message: `Delivery address and fee change ${input.decision.toLowerCase()}`,
    metadata: { reviewNote: input.reviewNote ?? null, parcelId: context.parcelId },
  });
  return { id: context.deliveryId };
}
