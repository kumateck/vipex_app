import { BadRequest, Conflict, NotFound } from '../../utils/http-error';
import { DeliveryMode } from '@/db/schemas';
import { getParcelRepo } from '../shipments/parcels.repository';
import {
  assertParcelFullyPaid,
  getParcelPaymentSettlement,
} from '../shipments/parcel-payment-settlement';
import { createDeliveryRepo, getDeliveryByParcelRepo, updateDeliveryRepo } from './repository';
import { toPesewas } from '@/server/utils/gh-money';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../shipments/parcel-delivery-reconciliation-guard';
import { emitRiderAssignmentsCreated } from '../communication/realtime';

export async function createDeliverySvc(input: {
  parcelId: string;
  mode: DeliveryMode;
  officeLocationId?: string | null;
  dropoffAddress?: string | null;
  chargeCedis?: number | string | null;
  createdBy: string;
  cashierSessionId?: string | null;
}) {
  const parcel = await getParcelRepo(input.parcelId);
  if (!parcel) throw NotFound('Parcel not found');

  if (input.mode === DeliveryMode.OFFICE && !input.officeLocationId)
    throw BadRequest('officeLocationId required for OFFICE');
  if (input.mode === DeliveryMode.DOORSTEP && !input.dropoffAddress)
    throw BadRequest('dropoffAddress required for DOORSTEP');

  if (input.chargeCedis != null) {
    const chargeValidationError = getParcelChargeValidationError({
      chargeExemptCustomerType: parcel.chargeExemptCustomerType,
      chargeCedis: Number(input.chargeCedis),
      plannedToBePaidCedis: 0,
    });
    if (chargeValidationError) throw BadRequest(chargeValidationError);
  }
  const chargePsw = input.chargeCedis != null ? toPesewas(input.chargeCedis) : 0n;
  const chargePswNumber = Number(chargePsw);

  const created = await createDeliveryRepo({
    parcelId: input.parcelId,
    mode: input.mode,
    status: 'QUEUED',
    officeLocationId: input.mode === DeliveryMode.OFFICE ? (input.officeLocationId ?? null) : null,
    dropoffAddress: input.mode === DeliveryMode.DOORSTEP ? (input.dropoffAddress ?? null) : null,
    chargePsw: chargePswNumber,
    amountPaidPsw: 0,
    createdBy: input.createdBy,
    cashierSessionId: input.cashierSessionId ?? null,
  });
  return { id: created.id };
}

export async function markOfficePickupCompleteSvc(input: {
  parcelId: string;
  frontDeskUserId: string;
  deliveryUserId: string;
}) {
  const delivery = await getDeliveryByParcelRepo(input.parcelId);
  if (!delivery) throw NotFound('Delivery not found');
  if (delivery.mode !== DeliveryMode.OFFICE) throw Conflict('Not an OFFICE delivery');
  const parcel = await getParcelRepo(input.parcelId);
  if (!parcel) throw NotFound('Parcel not found');

  // Ensure no outstanding principal dues before office handover
  await assertNoOpenParcelReconciliationCaseForDelivery(input.parcelId);
  const settlement = await getParcelPaymentSettlement(input.parcelId);
  const outstanding = Math.max(settlement.requiredPrincipalPsw - settlement.paidPrincipalPsw, 0);
  if (outstanding > 0)
    throw Conflict('Outstanding to-be-paid principal exists; collect before release');

  await assertParcelFullyPaid(input.parcelId);

  const updated = await updateDeliveryRepo(delivery.id, {
    status: 'DELIVERED',
    frontDeskUserId: input.frontDeskUserId,
    deliveryUserId: input.deliveryUserId,
    deliveredAt: new Date(),
  });
  if (!updated) throw NotFound('Delivery not found');
  return { id: updated.id };
}

export async function doorToDoorCallSvc(input: { parcelId: string; userId: string }) {
  const delivery = await getDeliveryByParcelRepo(input.parcelId);
  if (!delivery) throw NotFound('Delivery not found');
  if (delivery.mode !== DeliveryMode.DOORSTEP) throw Conflict('Not a DOORSTEP delivery');
  await assertNoOpenParcelReconciliationCaseForDelivery(input.parcelId);
  const updated = await updateDeliveryRepo(delivery.id, {
    receiverCalledConfirmedBy: input.userId,
    receiverCalledConfirmedAt: new Date(),
    status: 'CALLED',
  });
  if (!updated) throw NotFound('Delivery not found');
  return { id: updated.id };
}

export async function doorToDoorAssignSvc(input: { parcelId: string; riderUserId: string }) {
  const delivery = await getDeliveryByParcelRepo(input.parcelId);
  if (!delivery) throw NotFound('Delivery not found');
  if (delivery.mode !== DeliveryMode.DOORSTEP) throw Conflict('Not a DOORSTEP delivery');
  const parcel = await getParcelRepo(input.parcelId);
  if (!parcel) throw NotFound('Parcel not found');
  await assertNoOpenParcelReconciliationCaseForDelivery(input.parcelId);
  const updated = await updateDeliveryRepo(delivery.id, {
    riderUserId: input.riderUserId,
    riderAssignedAt: new Date(),
    status: 'ASSIGNED',
  });
  if (!updated) throw NotFound('Delivery not found');
  emitRiderAssignmentsCreated({
    companyId: parcel.companyId,
    riderUserId: input.riderUserId,
    parcelIds: [input.parcelId],
  });
  return { id: updated.id };
}

export async function doorToDoorOutForDeliverySvc(input: { parcelId: string }) {
  const delivery = await getDeliveryByParcelRepo(input.parcelId);
  if (!delivery) throw NotFound('Delivery not found');
  if (delivery.mode !== DeliveryMode.DOORSTEP) throw Conflict('Not a DOORSTEP delivery');
  await assertNoOpenParcelReconciliationCaseForDelivery(input.parcelId);
  const updated = await updateDeliveryRepo(delivery.id, {
    status: 'OUT_FOR_DELIVERY',
  });
  if (!updated) throw NotFound('Delivery not found');
  return { id: updated.id };
}
