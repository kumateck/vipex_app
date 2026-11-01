import { BadRequest, Conflict, NotFound } from '../../utils/http-error';
import { DeliveryMode } from '@/db/schemas';
import { getParcelRepo, updateParcelRepo } from '../shipments/parcels.repository';
import { ParcelStatus } from '@/db/schemas/enums';
import { createDeliveryRepo, getDeliveryByParcelRepo, updateDeliveryRepo } from './repository';
import { toPesewas } from '@/server/utils/gh-money';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../shipments/parcel-delivery-reconciliation-guard';
import { emitRiderAssignmentsCreated } from '../communication/realtime';

async function getOrCreateDoorstepDelivery(input: { parcelId: string; createdBy: string }) {
  const existing = await getDeliveryByParcelRepo(input.parcelId);
  if (existing) return existing;
  const created = await createDeliveryRepo({
    parcelId: input.parcelId,
    mode: DeliveryMode.DOORSTEP,
    status: 'QUEUED',
    chargePsw: 0,
    amountPaidPsw: 0,
    createdBy: input.createdBy,
  });
  const row = await getDeliveryByParcelRepo(input.parcelId);
  if (!row) throw NotFound(`Delivery ${created.id} not found`);
  return row;
}

export async function doorToDoorAddressCollectedSvc(input: {
  parcelId: string;
  userId: string;
  dropoffAddress: string;
  deliveryFeeCedis: number | string;
}) {
  const parcel = await getParcelRepo(input.parcelId);
  if (!parcel) throw NotFound('Parcel not found');
  if (
    parcel.status !== ParcelStatus.HOME_DELIVERY_REQUESTED &&
    parcel.status !== ParcelStatus.ADDRESS_COLLECTED &&
    parcel.status !== ParcelStatus.RETURNED_TO_OFFICE
  ) {
    throw Conflict('Parcel is not eligible for address collection');
  }

  const delivery = await getOrCreateDoorstepDelivery({
    parcelId: input.parcelId,
    createdBy: input.userId,
  });
  const doorstepFeeValidationError = getParcelChargeValidationError({
    chargeExemptCustomerType: parcel.chargeExemptCustomerType,
    chargeCedis: Number(input.deliveryFeeCedis),
    plannedToBePaidCedis: 0,
  });
  if (doorstepFeeValidationError) throw BadRequest(doorstepFeeValidationError);
  const chargePsw = Number(toPesewas(input.deliveryFeeCedis));
  await updateDeliveryRepo(delivery.id, {
    mode: DeliveryMode.DOORSTEP,
    status: 'ADDRESS_COLLECTED',
    dropoffAddress: input.dropoffAddress.trim(),
    chargePsw,
    receiverCalledConfirmedBy: input.userId,
    receiverCalledConfirmedAt: new Date(),
    updatedAt: new Date(),
  });

  await updateParcelRepo(input.parcelId, {
    status: ParcelStatus.ADDRESS_COLLECTED,
  });
  return { id: delivery.id };
}

export async function doorToDoorDispatchBulkSvc(input: {
  parcelIds: string[];
  riderUserId: string;
  userId: string;
}) {
  if (!input.parcelIds.length) throw BadRequest('Select at least one parcel');
  let updated = 0;
  const assignedParcelIdsByCompany = new Map<string, string[]>();
  const eligibleParcels: { id: string; companyId: string }[] = [];
  const candidateParcels = await Promise.all(
    input.parcelIds.map((parcelId) => getParcelRepo(parcelId)),
  );
  for (const parcel of candidateParcels) {
    if (!parcel) continue;
    if (
      parcel.status !== ParcelStatus.ADDRESS_COLLECTED &&
      parcel.status !== ParcelStatus.RETURNED_TO_OFFICE &&
      parcel.status !== ParcelStatus.DISPATCHED
    ) {
      continue;
    }
    eligibleParcels.push({ id: parcel.id, companyId: parcel.companyId });
  }
  await Promise.all(
    eligibleParcels.map((parcel) => assertNoOpenParcelReconciliationCaseForDelivery(parcel.id)),
  );

  for (const parcel of eligibleParcels) {
    const parcelId = parcel.id;
    const delivery = await getOrCreateDoorstepDelivery({
      parcelId,
      createdBy: input.userId,
    });
    await updateDeliveryRepo(delivery.id, {
      mode: DeliveryMode.DOORSTEP,
      status: 'DISPATCHED',
      riderUserId: input.riderUserId,
      riderAssignedAt: new Date(),
      updatedAt: new Date(),
    });
    await updateParcelRepo(parcelId, {
      status: ParcelStatus.DISPATCHED,
    });
    const companyParcelIds = assignedParcelIdsByCompany.get(parcel.companyId) ?? [];
    companyParcelIds.push(parcelId);
    assignedParcelIdsByCompany.set(parcel.companyId, companyParcelIds);
    updated += 1;
  }
  for (const [companyId, parcelIds] of assignedParcelIdsByCompany) {
    emitRiderAssignmentsCreated({ companyId, riderUserId: input.riderUserId, parcelIds });
  }
  return { updated };
}
