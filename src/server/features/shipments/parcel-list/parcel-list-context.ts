import { effectiveParcelReceivedAt } from '../parcel-repositories/parcel-repository.types';
import { and, eq, gt, gte, inArray, isNull, isNotNull, lte, lt, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import {
  parcels,
  branches,
  customers,
  consignmentItems,
  consignments,
  deliveries,
  locations,
  users,
  pickupQueues,
  warehouses,
  payments,
} from '@/db/schemas';
import { Payer, PaymentComponent } from '@/db/schemas/enums';

import { incomingTransitSendDateCondition } from '../incoming-transit-send-date';
import type { ListParcelsParams } from '../parcels.repository';
export function createParcelListContext(p: ListParcelsParams) {
  const whereParts: (
    | ReturnType<typeof eq>
    | ReturnType<typeof and>
    | ReturnType<typeof or>
    | ReturnType<typeof isNull>
    | ReturnType<typeof isNotNull>
    | ReturnType<typeof sql>
  )[] = [];
  if (!p.includeDeleted) whereParts.push(eq(parcels.isDeleted, false));
  if (p.parcelId) whereParts.push(eq(parcels.id, p.parcelId));
  if (p.companyId) whereParts.push(eq(parcels.companyId, p.companyId));
  if (p.ids?.length) whereParts.push(inArray(parcels.id, p.ids));
  if (p.sourceId) whereParts.push(eq(parcels.sourceId, p.sourceId));
  if (p.destinationId) whereParts.push(eq(parcels.destinationId, p.destinationId));
  if (p.shelfPickerAssigned)
    whereParts.push(
      sql`coalesce(${parcels.shelfPickerStaffId}, ${pickupQueues.pickerStaffId}) is not null`,
    );
  if (p.scopedBranchId)
    whereParts.push(
      or(eq(parcels.sourceId, p.scopedBranchId), eq(parcels.destinationId, p.scopedBranchId))!,
    );
  if (p.assignedToUserId) {
    whereParts.push(eq(parcels.callCenterAssignedToUserId, p.assignedToUserId));
  }
  if (p.callCenterUncalledOnly) whereParts.push(isNull(parcels.callCenterCalledAt));
  if (p.statuses && p.statuses.length > 0) {
    whereParts.push(inArray(parcels.status, p.statuses));
  } else if (p.status != null) {
    whereParts.push(eq(parcels.status, p.status));
  }
  if (p.riderReturnedOnly) {
    whereParts.push(eq(deliveries.status, 'RETURNED_TO_OFFICE'));
    whereParts.push(isNotNull(deliveries.returnedAt));
  }
  if (p.received === true) whereParts.push(isNotNull(parcels.receivedAt));
  if (p.received === false) whereParts.push(isNull(parcels.receivedAt));
  if (p.senderPaid === true) whereParts.push(lte(parcels.plannedToBePaidPsw, 0));
  if (p.senderPaid === false) whereParts.push(gt(parcels.plannedToBePaidPsw, 0));
  if (p.paymentType === 'paid') whereParts.push(lte(parcels.plannedToBePaidPsw, 0));
  if (p.paymentType === 'to_be_paid') {
    whereParts.push(
      and(gt(parcels.plannedToBePaidPsw, 0), gte(parcels.plannedToBePaidPsw, parcels.chargePsw))!,
    );
  }
  if (p.paymentType === 'partial') {
    whereParts.push(
      and(gt(parcels.plannedToBePaidPsw, 0), lt(parcels.plannedToBePaidPsw, parcels.chargePsw))!,
    );
  }
  const s = alias(customers, 's');
  const r = alias(customers, 'r');
  const sr = alias(customers, 'sr');
  const senderName = sql<string>`coalesce(nullif(btrim(${parcels.senderNameSnapshot}), ''), ${s.fullname}, '')`;
  const receiverName = sql<string>`coalesce(nullif(btrim(${parcels.receiverNameSnapshot}), ''), ${r.fullname}, '')`;
  const secondReceiverName = sql<
    string | null
  >`coalesce(nullif(btrim(${parcels.secondReceiverNameSnapshot}), ''), ${sr.fullname})`;
  const rider = alias(users, 'rider');
  const creator = alias(users, 'creator');
  const picker = alias(users, 'picker');
  const callCenterAssignee = alias(users, 'call_center_assignee');
  const d = alias(branches, 'd');
  const sb = alias(branches, 'sb');
  const sl = alias(locations, 'sl');
  const hb = alias(branches, 'hb');
  const ci = alias(consignmentItems, 'ci');
  const cg = alias(consignments, 'cg');
  if (p.sentDate) {
    whereParts.push(incomingTransitSendDateCondition(cg.createdAt, p.sentDate)!);
  }
  if (p.consignmentNumber?.trim()) {
    const term = p.consignmentNumber.trim();
    const serial = /^\d+$/.test(term) ? Number(term) : NaN;
    whereParts.push(
      Number.isSafeInteger(serial)
        ? or(eq(cg.serialForDay, serial), eq(cg.code, term))!
        : eq(cg.code, term),
    );
  }
  const pl = alias(locations, 'pl');
  const hl = alias(locations, 'hl');
  const hw = alias(warehouses, 'hw');
  const paidPrincipalPsw = sql<number>`coalesce((
    select sum(${payments.grossAmountPsw})
    from ${payments}
    where ${payments.parcelId} = ${parcels.id}
      and ${payments.component} = ${PaymentComponent.PRINCIPAL}
      and ${payments.voidedAt} is null
  ), 0)`;
  const senderPaidPrincipalPsw = sql<number>`coalesce((
    select sum(${payments.grossAmountPsw})
    from ${payments}
    where ${payments.parcelId} = ${parcels.id}
      and ${payments.component} = ${PaymentComponent.PRINCIPAL}
      and ${payments.payer} = ${Payer.SENDER}
      and ${payments.voidedAt} is null
  ), 0)`;
  const receiverPaidPrincipalPsw = sql<number>`coalesce((
    select sum(${payments.grossAmountPsw})
    from ${payments}
    where ${payments.parcelId} = ${parcels.id}
      and ${payments.component} = ${PaymentComponent.PRINCIPAL}
      and ${payments.payer} = ${Payer.RECIPIENT}
      and ${payments.voidedAt} is null
  ), 0)`;
  const paidDeliveryFeePsw = sql<number>`coalesce((
    select sum(${payments.grossAmountPsw})
    from ${payments}
    where ${payments.parcelId} = ${parcels.id}
      and ${payments.component} = ${PaymentComponent.DELIVERY_FEE}
      and ${payments.voidedAt} is null
  ), 0)`;
  const outstandingPrincipalPsw = sql<number>`greatest(
    ${parcels.chargePsw} - ${paidPrincipalPsw},
    0
  )`;
  const paidStoragePsw = sql<number>`coalesce((
    select sum(storage_payment.gross_amount_psw)
    from payments storage_payment
    where storage_payment.parcel_id = ${parcels.id}
      and storage_payment.component = ${PaymentComponent.OTHER}
      and storage_payment.voided_at is null
      and storage_payment.notes like 'STORAGE_CHARGE%'
  ), 0)`;
  const waivedStoragePsw = sql<number>`coalesce((
    select sum(storage_waiver.waived_amount_psw)
    from parcel_storage_waivers storage_waiver
    where storage_waiver.parcel_id = ${parcels.id}
  ), 0)`;
  const storageAccruedPsw = sql<number>`case when ${parcels.chargeExemptCustomerType} is not null then 0 else greatest(
    floor(
      extract(epoch from (now() - (${effectiveParcelReceivedAt()} +
        (${Math.max(1, Number(p.storageGraceDays ?? 14))} * interval '1 day')))) / 86400
    ),
    0
  ) * ${Math.max(0, Number(p.storageFeePerDayPsw ?? 0))} end`;
  const outstandingStoragePsw = sql<number>`greatest(
    ${storageAccruedPsw} - ${paidStoragePsw} - ${waivedStoragePsw},
    0
  )`;
  if (p.cashierCollectionRequired === true) {
    whereParts.push(sql`(${outstandingPrincipalPsw} > 0 or ${outstandingStoragePsw} > 0)`);
  }
  if (p.cashierCollectionRequired === false) {
    whereParts.push(sql`(${outstandingPrincipalPsw} <= 0 and ${outstandingStoragePsw} <= 0)`);
  }
  if (p.locationId) whereParts.push(eq(parcels.pickupLocationId, p.locationId));
  if (p.hasPickupQueue === true) whereParts.push(isNotNull(pickupQueues.id));
  if (p.hasPickupQueue === false) whereParts.push(isNull(pickupQueues.id));
  if (p.agedOnly === true || p.storageChargeAccruing === true) {
    const now = new Date();
    const graceDays = Math.max(1, Number(p.storageGraceDays ?? 14));
    const ageThresholdMonths = Math.max(1, Number(p.ageThresholdMonths ?? 6));

    whereParts.push(inArray(parcels.status, [5, 7]));
    whereParts.push(isNotNull(parcels.receivedAt));

    if (p.storageChargeAccruing === true) {
      whereParts.push(isNull(parcels.chargeExemptCustomerType));
      const chargeCutoff = new Date(now.getTime() - graceDays * 24 * 60 * 60 * 1000);
      whereParts.push(lte(parcels.receivedAt, chargeCutoff));
    }
    if (p.agedOnly === true) {
      const agedCutoff = new Date(now);
      agedCutoff.setMonth(agedCutoff.getMonth() - ageThresholdMonths);
      whereParts.push(lte(parcels.receivedAt, agedCutoff));
    }
  }
  return {
    whereParts,
    s,
    r,
    sr,
    senderName,
    receiverName,
    secondReceiverName,
    rider,
    creator,
    picker,
    callCenterAssignee,
    d,
    sb,
    sl,
    hb,
    ci,
    cg,
    pl,
    hl,
    hw,
    paidPrincipalPsw,
    senderPaidPrincipalPsw,
    receiverPaidPrincipalPsw,
    paidDeliveryFeePsw,
    outstandingPrincipalPsw,
    paidStoragePsw,
    waivedStoragePsw,
    storageAccruedPsw,
    outstandingStoragePsw,
  };
}
