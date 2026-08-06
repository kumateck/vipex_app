import { BadRequest, Conflict, NotFound } from '../../utils/http-error';

import {
  DeliveryMode,
  PaymentComponent,
  Payer,
  CashierType,
  PaymentMethod,
  CustomerCreditSourceType,
} from '@/db/schemas';
import { db } from '@/db/config';
import { createPaymentWithExecutorSvc, sumPrincipalPaidForParcelSvc } from '../payments/service';
import { getParcelRepo } from '../shipments/parcels.repository';
import { ParcelStatus } from '@/db/schemas/enums';
import { assertParcelFullyPaid } from '../shipments/parcel-payment-settlement';
import {
  createDeliveryRepo,
  getDeliveryByParcelRepo,
  listDoorstepByBranchRepo,
  listDoorstepByRiderRepo,
  type RiderDeliveryRow,
  updateDeliveryRepo,
} from './repository';
import { toPesewas } from '@/server/utils/gh-money';
import { updateParcelRepo } from '../shipments/parcels.repository';
import { postCustomerCreditChargeSvc } from '../customers/service';

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
  return db.transaction(async (tx) => {
    const parcel = await getParcelRepo(input.parcelId, tx);
    if (!parcel) throw NotFound('Parcel not found');

    if (input.principalAmountCedis && Number(input.principalAmountCedis) > 0) {
      if (input.method === PaymentMethod.CREDIT) {
        await postCustomerCreditChargeSvc({
          customerId: parcel.receiverId,
          companyId: input.companyId,
          amountPsw: Number(toPesewas(input.principalAmountCedis)),
          sourceType: CustomerCreditSourceType.DELIVERY,
          referenceId: input.parcelId,
          notes: 'Delivery principal posted on customer credit',
          createdBy: input.cashierUserId,
          executor: tx,
        });
      } else {
        await createPaymentWithExecutorSvc(
          {
            companyId: input.companyId,
            branchId: input.branchId,
            parcelId: input.parcelId,
            component: PaymentComponent.PRINCIPAL,
            payer: Payer.RECIPIENT,
            cashierType: CashierType.DELIVERY,
            method: input.method,
            cashierUserId: input.cashierUserId,
            amountCedis: input.principalAmountCedis,
          },
          tx,
        );
      }
    }

    if (input.deliveryFeeAmountCedis && Number(input.deliveryFeeAmountCedis) > 0) {
      if (input.method === PaymentMethod.CREDIT) {
        await postCustomerCreditChargeSvc({
          customerId: parcel.receiverId,
          companyId: input.companyId,
          amountPsw: Number(toPesewas(input.deliveryFeeAmountCedis)),
          sourceType: CustomerCreditSourceType.DELIVERY,
          referenceId: input.parcelId,
          notes: 'Delivery fee posted on customer credit',
          createdBy: input.cashierUserId,
          executor: tx,
        });
      } else {
        await createPaymentWithExecutorSvc(
          {
            companyId: input.companyId,
            branchId: input.branchId,
            parcelId: input.parcelId,
            component: PaymentComponent.DELIVERY_FEE,
            payer: Payer.RECIPIENT,
            cashierType: CashierType.DELIVERY,
            method: input.method,
            cashierUserId: input.cashierUserId,
            amountCedis: input.deliveryFeeAmountCedis,
          },
          tx,
        );
      }
    }

    const delivery = await getDeliveryByParcelRepo(input.parcelId, tx);
    if (!delivery) throw NotFound('Delivery not found');

    await assertParcelFullyPaid(input.parcelId, tx);

    const updated = await updateDeliveryRepo(
      delivery.id,
      {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
      tx,
    );
    if (!updated) throw NotFound('Delivery not found');
    return { id: updated.id };
  });
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
  for (const parcelId of input.parcelIds) {
    const parcel = await getParcelRepo(parcelId);
    if (!parcel) continue;
    if (
      parcel.status !== ParcelStatus.ADDRESS_COLLECTED &&
      parcel.status !== ParcelStatus.RETURNED_TO_OFFICE &&
      parcel.status !== ParcelStatus.DISPATCHED
    ) {
      continue;
    }

    const delivery = await getOrCreateDoorstepDelivery({
      parcelId,
      createdBy: input.userId,
    });
    await updateDeliveryRepo(delivery.id, {
      mode: DeliveryMode.DOORSTEP,
      status: 'DISPATCHED',
      riderUserId: input.riderUserId,
      updatedAt: new Date(),
    });
    await updateParcelRepo(parcelId, {
      status: ParcelStatus.DISPATCHED,
    });
    updated += 1;
  }
  return { updated };
}

export async function listDoorstepByRiderSvc(input: {
  riderUserId: string;
  mode?: 'current' | 'history';
}) {
  const parcelStatuses =
    input.mode === 'history'
      ? [ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER, ParcelStatus.DELIVERED_AT_HOME]
      : [ParcelStatus.DISPATCHED];
  const rows = await listDoorstepByRiderRepo({
    riderUserId: input.riderUserId,
    parcelStatuses,
  });
  const totals = rows.reduce(
    (acc, row) => {
      acc.expectedDeliveryFeePsw += row.deliveryFeePsw ?? 0;
      acc.expectedToBePaidPsw += row.plannedToBePaidPsw ?? 0;
      return acc;
    },
    { expectedDeliveryFeePsw: 0, expectedToBePaidPsw: 0 },
  );
  return {
    rows,
    totals: {
      ...totals,
      expectedTotalPsw: totals.expectedDeliveryFeePsw + totals.expectedToBePaidPsw,
    },
  };
}

type RiderBenchmarkMetrics = {
  completionRate: number;
  returnRate: number;
  averagePaidPsw: number;
  unresolvedOlderThanOneDay: number;
  completedCount: number;
  outstandingCount: number;
  totalKnown: number;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function computeRiderBenchmarkMetrics(rows: RiderDeliveryRow[]): RiderBenchmarkMetrics {
  const completedStatuses = new Set([
    ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
    ParcelStatus.DELIVERED_AT_HOME,
    ParcelStatus.RETURNED_TO_OFFICE,
  ]);
  const completedRows = rows.filter((row) => completedStatuses.has(row.parcelStatus));
  const outstandingRows = rows.filter((row) => row.parcelStatus === ParcelStatus.DISPATCHED);
  const completedCount = completedRows.length;
  const outstandingCount = outstandingRows.length;
  const totalKnown = completedCount + outstandingCount;
  const completionRate = totalKnown > 0 ? (completedCount / totalKnown) * 100 : 0;
  const returnedCount = completedRows.filter(
    (row) => row.parcelStatus === ParcelStatus.RETURNED_TO_OFFICE,
  ).length;
  const returnRate = completedCount > 0 ? (returnedCount / completedCount) * 100 : 0;
  const averagePaidPsw =
    completedCount > 0
      ? completedRows.reduce((sum, row) => sum + (row.amountPaidPsw ?? 0), 0) / completedCount
      : 0;
  const todayKey = startOfDay(new Date());
  const unresolvedOlderThanOneDay = outstandingRows.filter((row) => {
    const parsed = new Date(row.createdAt ?? row.updatedAt);
    if (Number.isNaN(parsed.getTime())) return false;
    return todayKey - startOfDay(parsed) >= 24 * 60 * 60 * 1000;
  }).length;

  return {
    completionRate,
    returnRate,
    averagePaidPsw,
    unresolvedOlderThanOneDay,
    completedCount,
    outstandingCount,
    totalKnown,
  };
}

export async function riderBranchBenchmarkSvc(input: { riderUserId: string; branchId: string }) {
  const parcelStatuses = [
    ParcelStatus.DISPATCHED,
    ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
    ParcelStatus.DELIVERED_AT_HOME,
    ParcelStatus.RETURNED_TO_OFFICE,
  ];
  const [riderRowsAll, branchRows] = await Promise.all([
    listDoorstepByRiderRepo({
      riderUserId: input.riderUserId,
      parcelStatuses,
    }),
    listDoorstepByBranchRepo({
      branchId: input.branchId,
      parcelStatuses,
    }),
  ]);

  const riderRows = riderRowsAll.filter((row) => row.destinationId === input.branchId);
  const rider = computeRiderBenchmarkMetrics(riderRows);

  const branchRowsByRider = new Map<string, RiderDeliveryRow[]>();
  for (const row of branchRows) {
    const rowRiderUserId = row.riderUserId?.trim();
    if (!rowRiderUserId) continue;
    const existing = branchRowsByRider.get(rowRiderUserId);
    if (existing) {
      existing.push(row);
      continue;
    }
    branchRowsByRider.set(rowRiderUserId, [row]);
  }

  const perRiderMetrics = Array.from(branchRowsByRider.values()).map((rows) =>
    computeRiderBenchmarkMetrics(rows),
  );
  const ridersCount = perRiderMetrics.length;
  const branchAverage: RiderBenchmarkMetrics =
    ridersCount > 0
      ? {
          completionRate:
            perRiderMetrics.reduce((sum, row) => sum + row.completionRate, 0) / ridersCount,
          returnRate: perRiderMetrics.reduce((sum, row) => sum + row.returnRate, 0) / ridersCount,
          averagePaidPsw:
            perRiderMetrics.reduce((sum, row) => sum + row.averagePaidPsw, 0) / ridersCount,
          unresolvedOlderThanOneDay:
            perRiderMetrics.reduce((sum, row) => sum + row.unresolvedOlderThanOneDay, 0) /
            ridersCount,
          completedCount:
            perRiderMetrics.reduce((sum, row) => sum + row.completedCount, 0) / ridersCount,
          outstandingCount:
            perRiderMetrics.reduce((sum, row) => sum + row.outstandingCount, 0) / ridersCount,
          totalKnown: perRiderMetrics.reduce((sum, row) => sum + row.totalKnown, 0) / ridersCount,
        }
      : {
          completionRate: 0,
          returnRate: 0,
          averagePaidPsw: 0,
          unresolvedOlderThanOneDay: 0,
          completedCount: 0,
          outstandingCount: 0,
          totalKnown: 0,
        };

  return {
    rider,
    branchAverage,
    branch: {
      id: input.branchId,
      ridersCount,
      samples: branchRows.length,
    },
  };
}

export async function doorToDoorRiderGivenToCustomerSvc(input: {
  parcelId: string;
  riderUserId: string;
  signatureImage: string;
  secondReceiverId?: string | null;
  cardId?: string | null;
  cardNumber?: string | null;
  secondCardId?: string | null;
  secondCardNumber?: string | null;
}) {
  const parcel = await getParcelRepo(input.parcelId);
  if (!parcel) throw NotFound('Parcel not found');
  if (parcel.status !== ParcelStatus.DISPATCHED) {
    throw Conflict('Parcel is not dispatched');
  }
  const delivery = await getDeliveryByParcelRepo(input.parcelId);
  if (!delivery) throw NotFound('Delivery not found');
  if (delivery.riderUserId !== input.riderUserId) {
    throw Conflict('Parcel is not assigned to this rider');
  }

  const signatureImage = input.signatureImage.trim();
  if (!signatureImage) throw BadRequest('Signature is required');

  await updateParcelRepo(input.parcelId, {
    status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
    secondReceiverId: input.secondReceiverId ?? parcel.secondReceiverId,
    cardId: input.cardId ?? parcel.cardId,
    cardNumber: input.cardNumber ?? parcel.cardNumber,
    secondCardId: input.secondCardId ?? parcel.secondCardId,
    secondCardNumber: input.secondCardNumber ?? parcel.secondCardNumber,
    confirmedBy: input.riderUserId,
    confirmedAt: new Date(),
  });

  await updateDeliveryRepo(delivery.id, {
    status: 'RIDER_GIVEN_PARCEL_TO_CUSTOMER',
    signatureImage,
    confirmedBy: input.riderUserId,
    confirmedAt: new Date(),
    updatedAt: new Date(),
  });

  return { id: delivery.id };
}

export async function doorToDoorReturnToOfficeSvc(input: {
  parcelId: string;
  riderUserId: string;
}) {
  const parcel = await getParcelRepo(input.parcelId);
  if (!parcel) throw NotFound('Parcel not found');
  if (parcel.status !== ParcelStatus.DISPATCHED) {
    throw Conflict('Only dispatched parcels can be returned');
  }
  const delivery = await getDeliveryByParcelRepo(input.parcelId);
  if (!delivery) throw NotFound('Delivery not found');
  if (delivery.riderUserId !== input.riderUserId) {
    throw Conflict('Parcel is not assigned to this rider');
  }

  await updateParcelRepo(input.parcelId, {
    status: ParcelStatus.AWAITING_PICKUP,
  });
  await updateDeliveryRepo(delivery.id, {
    status: 'RETURNED_TO_OFFICE',
    chargePsw: 0,
    updatedAt: new Date(),
  });
  return { id: delivery.id };
}

export async function doorToDoorFinalizeAtOfficeSvc(input: {
  parcelId: string;
  cashierUserId: string;
  branchId: string;
  companyId: string;
  principalAmountCedis?: number | string | null;
  deliveryFeeAmountCedis?: number | string | null;
  method: PaymentMethod;
}) {
  return db.transaction(async (tx) => {
    const parcel = await getParcelRepo(input.parcelId, tx);
    if (!parcel) throw NotFound('Parcel not found');
    if (parcel.status !== ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER) {
      throw Conflict('Parcel is not ready for delivery cashier finalization');
    }
    const delivery = await getDeliveryByParcelRepo(input.parcelId, tx);
    if (!delivery) throw NotFound('Delivery not found');

    let collectedPsw = 0;
    if (input.principalAmountCedis && Number(input.principalAmountCedis) > 0) {
      if (input.method === PaymentMethod.CREDIT) {
        const amountPsw = Number(toPesewas(input.principalAmountCedis));
        await postCustomerCreditChargeSvc({
          customerId: parcel.receiverId,
          companyId: input.companyId,
          amountPsw,
          sourceType: CustomerCreditSourceType.DELIVERY,
          referenceId: input.parcelId,
          notes: 'Finalized delivery principal posted on customer credit',
          createdBy: input.cashierUserId,
          executor: tx,
        });
        collectedPsw += amountPsw;
      } else {
        const payment = await createPaymentWithExecutorSvc(
          {
            companyId: input.companyId,
            branchId: input.branchId,
            parcelId: input.parcelId,
            component: PaymentComponent.PRINCIPAL,
            payer: Payer.RECIPIENT,
            cashierType: CashierType.DELIVERY,
            method: input.method,
            cashierUserId: input.cashierUserId,
            amountCedis: input.principalAmountCedis,
          },
          tx,
        );
        collectedPsw += payment.amounts.grossPsw;
      }
    }

    if (input.deliveryFeeAmountCedis && Number(input.deliveryFeeAmountCedis) > 0) {
      if (input.method === PaymentMethod.CREDIT) {
        const amountPsw = Number(toPesewas(input.deliveryFeeAmountCedis));
        await postCustomerCreditChargeSvc({
          customerId: parcel.receiverId,
          companyId: input.companyId,
          amountPsw,
          sourceType: CustomerCreditSourceType.DELIVERY,
          referenceId: input.parcelId,
          notes: 'Finalized delivery fee posted on customer credit',
          createdBy: input.cashierUserId,
          executor: tx,
        });
        collectedPsw += amountPsw;
      } else {
        const payment = await createPaymentWithExecutorSvc(
          {
            companyId: input.companyId,
            branchId: input.branchId,
            parcelId: input.parcelId,
            component: PaymentComponent.DELIVERY_FEE,
            payer: Payer.RECIPIENT,
            cashierType: CashierType.DELIVERY,
            method: input.method,
            cashierUserId: input.cashierUserId,
            amountCedis: input.deliveryFeeAmountCedis,
          },
          tx,
        );
        collectedPsw += payment.amounts.grossPsw;
      }
    }

    await updateDeliveryRepo(
      delivery.id,
      {
        status: 'DELIVERED_AT_HOME',
        amountPaidPsw: Number(delivery.amountPaidPsw ?? 0) + collectedPsw,
        deliveredAt: new Date(),
        confirmedBy: input.cashierUserId,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      },
      tx,
    );
    await updateParcelRepo(
      input.parcelId,
      {
        status: ParcelStatus.DELIVERED_AT_HOME,
      },
      tx,
    );
    return { id: delivery.id };
  });
}
