import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { cashierSessions, deliveries, parcels, payments, users } from '@/db/schemas';
import {
  CashierType,
  DeliveryMode,
  ParcelStatus,
  Payer,
  PaymentComponent,
  PaymentMethod,
  UserType,
} from '@/db/schemas/enums';
import { createShelfPickupFixture } from './shelf-pickup-fixture';

export async function createRiderReturnFeeFixture() {
  const base = await createShelfPickupFixture();
  await db
    .update(users)
    .set({ userType: UserType.RIDER })
    .where(inArray(users.id, [base.oldPicker, base.newPicker]));
  await db.insert(cashierSessions).values({
    cashierId: base.actor,
    branchId: base.branchId,
    scheduledStartTime: new Date(),
    scheduledEndTime: new Date(Date.now() + 86400000),
    status: 'ACTIVE',
  });

  const parcel = async (feePsw = 2500, paidFeePsw = 0) => {
    const row = await base.parcel();
    await db
      .update(parcels)
      .set({
        status: ParcelStatus.DISPATCHED,
        chargePsw: 0,
        plannedToBePaidPsw: 0,
      })
      .where(eq(parcels.id, row.id));
    await db.insert(deliveries).values({
      parcelId: row.id,
      mode: DeliveryMode.DOORSTEP,
      status: 'DISPATCHED',
      dropoffAddress: 'Customer home',
      chargePsw: feePsw,
      riderUserId: base.oldPicker,
      riderAssignedAt: new Date(),
      createdBy: base.actor,
    });
    if (paidFeePsw > 0)
      await db.insert(payments).values({
        companyId: base.companyId,
        branchId: base.branchId,
        parcelId: row.id,
        component: PaymentComponent.DELIVERY_FEE,
        payer: Payer.RECIPIENT,
        cashierType: CashierType.DELIVERY,
        method: PaymentMethod.CASH,
        cashierUserId: base.actor,
        grossAmountPsw: paidFeePsw,
        netAmountPsw: paidFeePsw,
        vatPsw: 0,
        getfundPsw: 0,
        nhilPsw: 0,
        covidPsw: 0,
        taxTotalPsw: 0,
      });
    return row.id;
  };

  const cleanup = async () => {
    const rows = await db
      .select({ id: parcels.id })
      .from(parcels)
      .where(eq(parcels.companyId, base.companyId));
    await db.delete(payments).where(eq(payments.companyId, base.companyId));
    if (rows.length)
      await db.delete(deliveries).where(
        inArray(
          deliveries.parcelId,
          rows.map((row) => row.id),
        ),
      );
    await db.delete(cashierSessions).where(eq(cashierSessions.cashierId, base.actor));
    await base.cleanup();
  };
  return { ...base, parcel, cleanup };
}
