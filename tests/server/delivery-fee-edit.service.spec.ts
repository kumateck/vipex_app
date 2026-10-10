import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, deliveries, parcels, rolePermissions } from '@/db/schemas';
import { DeliveryMode, ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  getDeliveryFeeSvc,
  updateDeliveryFeeSvc,
  doorToDoorFinalizeAtOfficeSvc,
} from '@/server/features/deliveries';
import { getDeliveryByParcelRepo } from '@/server/features/deliveries/repository';
import { createTestAccessToken } from '../utils/auth-session';
import { http } from '../utils/request';
import { createRiderReturnFeeFixture } from '../utils/rider-return-fee-fixture';

describe('staff delivery fee editing', () => {
  let fixture: Awaited<ReturnType<typeof createRiderReturnFeeFixture>>;
  beforeAll(async () => {
    fixture = await createRiderReturnFeeFixture();
  });
  afterAll(async () => {
    await fixture?.cleanup();
  });
  const scope = (parcelId: string) => ({
    parcelId,
    companyId: fixture.companyId,
    branchId: fixture.branchId,
    actorUserId: fixture.actor,
  });
  const edit = async (parcelId: string, fee = '30.00') => {
    const current = await getDeliveryFeeSvc(scope(parcelId));
    return updateDeliveryFeeSvc({
      ...scope(parcelId),
      deliveryFeeCedis: fee,
      expectedChargePsw: current.chargePsw,
      expectedUpdatedAt: current.updatedAt,
      reason: 'Confirmed with customer',
    });
  };
  test('restores an erased fee with an audit record and preserves assignment and state', async () => {
    const parcelId = await fixture.parcel(0);
    await db
      .update(parcels)
      .set({ status: ParcelStatus.RETURNED_TO_OFFICE })
      .where(eq(parcels.id, parcelId));
    const previous = await getDeliveryByParcelRepo(parcelId);
    expect(await edit(parcelId)).toMatchObject({ chargePsw: 3000, changed: true });
    expect(await getDeliveryByParcelRepo(parcelId)).toMatchObject({
      chargePsw: 3000,
      status: previous!.status,
      riderUserId: previous!.riderUserId,
      dropoffAddress: previous!.dropoffAddress,
      amountPaidPsw: previous!.amountPaidPsw,
    });
    expect((await db.select().from(parcels).where(eq(parcels.id, parcelId)))[0]!.status).toBe(
      ParcelStatus.RETURNED_TO_OFFICE,
    );
    const audit = await db.select().from(auditLogs).where(eq(auditLogs.entityId, previous!.id));
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      action: 'DELIVERY_FEE_UPDATED',
      actorUserId: fixture.actor,
      metadata: {
        previousChargePsw: 0,
        chargePsw: 3000,
        reason: 'Confirmed with customer',
        parcelId,
      },
    });
    expect((await edit(parcelId)).changed).toBe(false);
    expect(
      await db.select().from(auditLogs).where(eq(auditLogs.entityId, previous!.id)),
    ).toHaveLength(1);
  });
  test('cashier can restore a fee after rider handover and collect it', async () => {
    const parcelId = await fixture.parcel(0);
    await db
      .update(parcels)
      .set({ status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER })
      .where(eq(parcels.id, parcelId));
    await edit(parcelId, '25.00');
    await doorToDoorFinalizeAtOfficeSvc({
      parcelId,
      companyId: fixture.companyId,
      branchId: fixture.branchId,
      cashierUserId: fixture.actor,
      deliveryFeeAmountCedis: '25.00',
      method: PaymentMethod.CASH,
    });
    expect((await getDeliveryByParcelRepo(parcelId))?.chargePsw).toBe(2500);
    await expect(edit(parcelId)).rejects.toThrow('cannot be edited in this parcel state');
  });
  test('rejects invalid amounts and reasons without changing the fee', async () => {
    const parcelId = await fixture.parcel();
    for (const fee of ['', '-1', 'NaN', 'Infinity', '1.001', '100000.01', '1e3']) {
      await expect(edit(parcelId, fee)).rejects.toThrow();
    }
    const current = await getDeliveryFeeSvc(scope(parcelId));
    await expect(
      updateDeliveryFeeSvc({
        ...scope(parcelId),
        expectedChargePsw: current.chargePsw,
        expectedUpdatedAt: current.updatedAt,
        deliveryFeeCedis: '30',
        reason: '  ',
      }),
    ).rejects.toThrow('reason');
    expect((await getDeliveryByParcelRepo(parcelId))?.chargePsw).toBe(2500);
  });
  test('prevents stale concurrent edits from overwriting a correction', async () => {
    const parcelId = await fixture.parcel();
    const current = await getDeliveryFeeSvc(scope(parcelId));
    const input = {
      ...scope(parcelId),
      expectedChargePsw: current.chargePsw,
      expectedUpdatedAt: current.updatedAt,
      reason: 'Customer confirmed fee',
    };
    const results = await Promise.allSettled([
      updateDeliveryFeeSvc({ ...input, deliveryFeeCedis: '30' }),
      updateDeliveryFeeSvc({ ...input, deliveryFeeCedis: '35' }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
  });
  test('does not reduce fees below posted payments or rider-recorded collections', async () => {
    const paidId = await fixture.parcel(2500, 1000);
    await expect(edit(paidId, '9.99')).rejects.toThrow('less than payments');
    const riderId = await fixture.parcel();
    await db
      .update(deliveries)
      .set({ riderCollectedDeliveryFeePsw: 2000 })
      .where(eq(deliveries.parcelId, riderId));
    await expect(edit(riderId, '19.99')).rejects.toThrow('recorded rider collection');
    expect((await edit(riderId, '20')).chargePsw).toBe(2000);
    const freeId = await fixture.parcel();
    expect((await edit(freeId, '0')).chargePsw).toBe(0);
  });
  test('rejects foreign scope, riders, office mode, pending requests, and deleted parcels', async () => {
    const parcelId = await fixture.parcel();
    await expect(getDeliveryFeeSvc({ ...scope(parcelId), branchId: createId() })).rejects.toThrow(
      'active branch staff',
    );
    await expect(
      getDeliveryFeeSvc({ ...scope(parcelId), actorUserId: fixture.oldPicker }),
    ).rejects.toThrow('riders must request review');
    await db
      .update(deliveries)
      .set({ changeRequestStatus: 'PENDING' })
      .where(eq(deliveries.parcelId, parcelId));
    await expect(edit(parcelId)).rejects.toThrow('pending delivery change');
    await db
      .update(deliveries)
      .set({ changeRequestStatus: null, mode: DeliveryMode.OFFICE })
      .where(eq(deliveries.parcelId, parcelId));
    await expect(edit(parcelId)).rejects.toThrow('Not a doorstep');
    await db
      .update(deliveries)
      .set({ mode: DeliveryMode.DOORSTEP })
      .where(eq(deliveries.parcelId, parcelId));
    await db.update(parcels).set({ isDeleted: true }).where(eq(parcels.id, parcelId));
    await expect(edit(parcelId)).rejects.toThrow('not found');
  });
  test('API requires permission, uses authenticated scope and permits authorized cashiers', async () => {
    const parcelId = await fixture.parcel(0);
    const token = await createTestAccessToken({
      userId: fixture.actor,
      email: `${fixture.actor}@example.test`,
      roleId: fixture.roleId,
      companyId: fixture.companyId,
      branchId: fixture.branchId,
      permissions: [],
    });
    const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
    expect((await http('GET', `/v1/deliveries/dd/${parcelId}/fee`)).status).toBe(401);
    expect((await http('GET', `/v1/deliveries/dd/${parcelId}/fee`, { headers })).status).toBe(403);
    await db.insert(rolePermissions).values({
      companyId: fixture.companyId,
      roleId: fixture.roleId,
      permission: PermissionKeys.CanCompleteDoorstepDelivery,
    });
    const response = await http('GET', `/v1/deliveries/dd/${parcelId}/fee`, { headers });
    expect(response.status).toBe(200);
    const current = await response.json();
    const saved = await http('PATCH', `/v1/deliveries/dd/${parcelId}/fee`, {
      headers,
      body: JSON.stringify({
        deliveryFeeCedis: '25.00',
        expectedChargePsw: 0,
        expectedUpdatedAt: current.updatedAt,
        reason: 'Production fee correction',
        actorUserId: fixture.oldPicker,
        companyId: createId(),
        branchId: createId(),
      }),
    });
    expect(saved.status).toBe(200);
    expect(await saved.json()).toMatchObject({ chargePsw: 2500, changed: true });
  });
});
