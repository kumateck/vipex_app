import { spyOn, expect } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  branches,
  cashierSessions,
  customers,
  parcelReceiverOtps,
  parcels,
  payments,
  rolePermissions,
} from '@/db/schemas';
import * as notifications from '@/server/features/notification-hub/service';
import { requestBatchOtp, verifyBatchOtp } from '@/server/features/parcel-batch-handover/otp';
import type { BatchActor } from '@/server/features/parcel-batch-handover/selection';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createShelfPickupFixture } from './shelf-pickup-fixture';

export async function createBatchSignatureFixture(cashier: boolean) {
  const fixture = await createShelfPickupFixture();
  const telephone = `024${Date.now().toString().slice(-7)}`;
  const workflow = cashier ? ('receiver-cashier' as const) : ('office-pickup' as const);
  await db.update(customers).set({ telephone }).where(eq(customers.companyId, fixture.companyId));
  await db
    .update(branches)
    .set({
      usePickupQueue: true,
      requirePickupOtp: true,
      requireReceiverOtp: true,
      requireReceiverCashierSignature: true,
    })
    .where(eq(branches.id, fixture.branchId));
  await db.insert(rolePermissions).values({
    companyId: fixture.companyId,
    roleId: fixture.roleId,
    permission: cashier
      ? PermissionKeys.CanCreateReceiverPayments
      : PermissionKeys.CanCompleteOfficePickup,
  });
  if (cashier)
    await db.insert(cashierSessions).values({
      cashierId: fixture.actor,
      branchId: fixture.branchId,
      status: 'ACTIVE',
      scheduledStartTime: new Date(),
      scheduledEndTime: new Date(Date.now() + 86_400_000),
    });
  const rows = await Promise.all([fixture.parcel(), fixture.parcel(), fixture.parcel()]);
  const principalPsw = cashier ? 1000 : 0;
  await db
    .update(parcels)
    .set({ chargePsw: principalPsw, plannedToBePaidPsw: principalPsw, receivedAt: new Date() })
    .where(
      inArray(
        parcels.id,
        rows.map(({ id }) => id),
      ),
    );
  const tickets = await Promise.all(rows.map(({ id }) => fixture.ticket(id)));
  const selection = {
    telephone,
    items: rows
      .slice(0, 2)
      .map(({ id, receiverId }) => ({ id, receiverId, principalPsw, storagePsw: 0 })),
  };
  const actor: BatchActor = {
    companyId: fixture.companyId,
    branchId: fixture.branchId,
    actorId: fixture.actor,
    locationId: fixture.locationId,
    workflow,
  };
  const dispatch = spyOn(notifications, 'dispatchSmsEventSvc').mockResolvedValue({
    status: 'sent',
  } as never);
  let issued;
  try {
    issued = await requestBatchOtp(actor, { ...selection, channel: 'sms' });
    expect(dispatch).toHaveBeenCalledTimes(1);
    const code = String(dispatch.mock.calls[0]![0].variables.otp);
    await verifyBatchOtp(actor, { id: issued.id, otp: code });
  } finally {
    dispatch.mockRestore();
  }
  const [otp] = await db
    .select()
    .from(parcelReceiverOtps)
    .where(eq(parcelReceiverOtps.id, issued.id));
  return {
    fixture,
    actor,
    rows,
    tickets,
    input: { ...selection, id: issued.id, verificationToken: otp!.verificationToken! },
    reader: {
      companyId: actor.companyId,
      branchId: actor.branchId,
      actorId: fixture.oldPicker,
      workflows: [workflow],
    },
    async cleanup() {
      await db
        .delete(parcelReceiverOtps)
        .where(eq(parcelReceiverOtps.companyId, fixture.companyId));
      await db.delete(payments).where(eq(payments.companyId, fixture.companyId));
      await db.delete(cashierSessions).where(eq(cashierSessions.cashierId, fixture.actor));
      await fixture.cleanup();
    },
  };
}
