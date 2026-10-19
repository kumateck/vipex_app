import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, customers } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { doorToDoorRiderGivenToCustomerSvc } from '@/server/features/deliveries/rider-handover.service';
import { getParcelRepo } from '@/server/features/shipments/parcels.repository';
import { getDeliveryByParcelRepo } from '@/server/features/deliveries/repository';
import { listDoorstepByRiderSvc } from '@/server/features/deliveries/service';
import {
  setParcelSecondReceiverSvc,
  removeParcelSecondReceiverSvc,
} from '@/server/features/shipments/parcel-second-receiver.service';
import { createRiderReturnFeeFixture } from '../utils/rider-return-fee-fixture';

describe('rider handover second receiver', () => {
  let fixture: Awaited<ReturnType<typeof createRiderReturnFeeFixture>>;
  beforeAll(async () => {
    fixture = await createRiderReturnFeeFixture();
  });
  afterAll(async () => {
    await fixture?.cleanup();
  });
  const customer = async (name: string, deleted = false) => {
    const [row] = await db
      .insert(customers)
      .values({
        companyId: fixture.companyId,
        fullname: name,
        telephone: `05${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        createdBy: fixture.actor,
        isDeleted: deleted,
      })
      .returning();
    return row!;
  };
  const handover = (parcelId: string, secondReceiverId: string, riderUserId = fixture.oldPicker) =>
    doorToDoorRiderGivenToCustomerSvc({
      parcelId,
      riderUserId,
      secondReceiverId,
      signatureImage: 'data:image/png;base64,signed',
      deliveryFeeAmountCedis: 0,
    });

  const cashierSets = (parcelId: string, telephone = '0551112222') =>
    setParcelSecondReceiverSvc({
      parcelId,
      companyId: fixture.companyId,
      branchId: fixture.branchId,
      actorUserId: fixture.actor,
      fullname: 'Cashier-authorized receiver',
      telephone,
    });
  test('cashier adds a receiver while dispatched and rider selects it without creating a customer', async () => {
    const parcelId = await fixture.parcel();
    const saved = await cashierSets(parcelId);
    const before = await getParcelRepo(parcelId);
    const list = await listDoorstepByRiderSvc({ riderUserId: fixture.oldPicker });
    expect(list.rows.find((row) => row.parcelId === parcelId)).toMatchObject({
      secondReceiverId: saved.secondReceiverId,
      secondReceiverName: 'Cashier-authorized receiver',
      secondReceiverPhone: '0551112222',
    });
    await doorToDoorRiderGivenToCustomerSvc({
      parcelId,
      riderUserId: fixture.oldPicker,
      handoverTarget: 'second',
      secondReceiverId: saved.secondReceiverId,
      signatureImage: 'data:image/png;base64,signed',
    });
    expect(await getParcelRepo(parcelId)).toMatchObject({
      status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
      secondReceiverId: saved.secondReceiverId,
      secondReceiverNameSnapshot: before?.secondReceiverNameSnapshot,
    });
    expect((await getDeliveryByParcelRepo(parcelId))?.signatureImage).toBe(
      'data:image/png;base64,signed',
    );
    const audit = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityId, parcelId),
          eq(auditLogs.action, 'RIDER_HANDOVER_RECEIVER_SELECTED'),
        ),
      );
    expect(audit).toHaveLength(1);
    expect(audit[0]?.metadata).toMatchObject({
      handoverTarget: 'second',
      receiverId: saved.secondReceiverId,
    });
    await expect(cashierSets(parcelId)).rejects.toThrow('can no longer change');
  });
  test('rejects stale or unlinked mobile choices and preserves the signature state', async () => {
    const parcelId = await fixture.parcel();
    const first = await cashierSets(parcelId);
    const second = await cashierSets(parcelId, '0553334444');
    await expect(
      doorToDoorRiderGivenToCustomerSvc({
        parcelId,
        riderUserId: fixture.oldPicker,
        handoverTarget: 'second',
        secondReceiverId: first.secondReceiverId,
        signatureImage: 'data:image/png;base64,signed',
      }),
    ).rejects.toThrow('refresh');
    await removeParcelSecondReceiverSvc({
      parcelId,
      companyId: fixture.companyId,
      branchId: fixture.branchId,
      actorUserId: fixture.actor,
    });
    await expect(
      doorToDoorRiderGivenToCustomerSvc({
        parcelId,
        riderUserId: fixture.oldPicker,
        handoverTarget: 'second',
        secondReceiverId: second.secondReceiverId,
        signatureImage: 'data:image/png;base64,signed',
      }),
    ).rejects.toThrow('refresh');
    expect((await getParcelRepo(parcelId))?.status).toBe(ParcelStatus.DISPATCHED);
    expect((await getDeliveryByParcelRepo(parcelId))?.signatureImage).toBeNull();
  });
  test('main receiver selection keeps the cashier-added contact and records who received the parcel', async () => {
    const parcelId = await fixture.parcel();
    const saved = await cashierSets(parcelId);
    await doorToDoorRiderGivenToCustomerSvc({
      parcelId,
      riderUserId: fixture.oldPicker,
      handoverTarget: 'main',
      signatureImage: 'data:image/png;base64,main-signature',
    });
    expect((await getParcelRepo(parcelId))?.secondReceiverId).toBe(saved.secondReceiverId);
    const audit = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityId, parcelId),
          eq(auditLogs.action, 'RIDER_HANDOVER_RECEIVER_SELECTED'),
        ),
      );
    expect(audit[0]?.metadata).toMatchObject({ handoverTarget: 'main' });
  });
  test('rejects the main receiver and inactive customers without completing delivery', async () => {
    const parcelId = await fixture.parcel();
    const parcel = await getParcelRepo(parcelId);
    const deleted = await customer('Deleted Receiver', true);
    for (const id of [parcel!.receiverId, deleted.id, 'missing-receiver']) {
      await expect(handover(parcelId, id)).rejects.toThrow();
      expect(await getParcelRepo(parcelId)).toMatchObject({
        status: ParcelStatus.DISPATCHED,
        secondReceiverId: null,
      });
      expect((await getDeliveryByParcelRepo(parcelId))?.signatureImage).toBeNull();
    }
  });
  test('keeps assignment validation ahead of all receiver mutations', async () => {
    const parcelId = await fixture.parcel();
    const receiver = await customer('Not handed over');
    await expect(handover(parcelId, receiver.id, fixture.newPicker)).rejects.toThrow(
      'not assigned',
    );
    expect(await getParcelRepo(parcelId)).toMatchObject({
      status: ParcelStatus.DISPATCHED,
      secondReceiverId: null,
    });
  });
});
