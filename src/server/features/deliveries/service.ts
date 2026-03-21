import { BadRequest, Conflict, NotFound } from '../../utils/http-error';

import { DeliveryMode, PaymentComponent, Payer, CashierType, PaymentMethod } from '@/db/schemas';
import { createPaymentSvc, sumPrincipalPaidForParcelSvc } from '../payments/service';
import { getParcelRepo } from '../shipments/parcels.repository';
import { assertParcelFullyPaid } from '../shipments/parcel-payment-settlement';
import { createDeliveryRepo, getDeliveryByParcelRepo, updateDeliveryRepo } from './repository';
import { toPesewas } from '@/server/utils/gh-money';

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
  const principalPaid = await sumPrincipalPaidForParcelSvc(input.parcelId);
  const outstanding =
    parcel.plannedToBePaidPsw > principalPaid ? parcel.plannedToBePaidPsw - principalPaid : 0;
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
  const updated = await updateDeliveryRepo(delivery.id, {
    riderUserId: input.riderUserId,
    status: 'ASSIGNED',
  });
  if (!updated) throw NotFound('Delivery not found');
  return { id: updated.id };
}

export async function doorToDoorOutForDeliverySvc(input: { parcelId: string }) {
  const delivery = await getDeliveryByParcelRepo(input.parcelId);
  if (!delivery) throw NotFound('Delivery not found');
  if (delivery.mode !== DeliveryMode.DOORSTEP) throw Conflict('Not a DOORSTEP delivery');
  const updated = await updateDeliveryRepo(delivery.id, {
    status: 'OUT_FOR_DELIVERY',
  });
  if (!updated) throw NotFound('Delivery not found');
  return { id: updated.id };
}

export async function doorToDoorCompleteSvc(input: {
  parcelId: string;
  cashierUserId: string;
  branchId: string;
  companyId: string;
  // Optional collections at doorstep:
  principalAmountCedis?: number | string | null; // to-be-paid principal (taxable)
  deliveryFeeAmountCedis?: number | string | null; // delivery fee (non-taxable)
  method: PaymentMethod;
}) {
  const parcel = await getParcelRepo(input.parcelId);
  if (!parcel) throw NotFound('Parcel not found');

  // Collect principal (if provided)
  if (input.principalAmountCedis && Number(input.principalAmountCedis) > 0) {
    await createPaymentSvc({
      companyId: input.companyId,
      branchId: input.branchId,
      parcelId: input.parcelId,
      component: PaymentComponent.PRINCIPAL,
      payer: Payer.RECIPIENT,
      cashierType: CashierType.DELIVERY,
      method: input.method,
      cashierUserId: input.cashierUserId,
      amountCedis: input.principalAmountCedis,
    });
  }

  // Collect delivery fee (if provided)
  if (input.deliveryFeeAmountCedis && Number(input.deliveryFeeAmountCedis) > 0) {
    await createPaymentSvc({
      companyId: input.companyId,
      branchId: input.branchId,
      parcelId: input.parcelId,
      component: PaymentComponent.DELIVERY_FEE,
      payer: Payer.RECIPIENT,
      cashierType: CashierType.DELIVERY,
      method: input.method,
      cashierUserId: input.cashierUserId,
      amountCedis: input.deliveryFeeAmountCedis,
    });
  }

  const delivery = await getDeliveryByParcelRepo(input.parcelId);
  if (!delivery) throw NotFound('Delivery not found');

  await assertParcelFullyPaid(input.parcelId);

  const updated = await updateDeliveryRepo(delivery.id, {
    status: 'DELIVERED',
    deliveredAt: new Date(),
  });
  if (!updated) throw NotFound('Delivery not found');
  return { id: updated.id };
}
