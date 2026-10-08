import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, branches, parcels, pickupQueues, users } from '@/db/schemas';
import { ParcelStatus, UserStatus } from '@/db/schemas/enums';
import { updateParcelShelfPickerSvc as reassign } from '@/server/features/shipments/shelf-picker-assignment.service';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

describe('shelf pickup reassignment transactions', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  beforeAll(async () => {
    fixture = await createShelfPickupFixture();
  });
  afterAll(async () => {
    await fixture?.cleanup();
  });
  const input = (parcelId: string) => ({
    parcelId,
    companyId: fixture.companyId,
    branchId: fixture.branchId,
    locationId: fixture.locationId,
    actorUserId: fixture.actor,
    userId: fixture.newPicker,
    expectedPickerStaffId: fixture.oldPicker,
  });
  const readParcel = async (id: string) =>
    (await db.select().from(parcels).where(eq(parcels.id, id)))[0]!;
  const readTicket = async (id: string) =>
    (await db.select().from(pickupQueues).where(eq(pickupQueues.id, id)))[0]!;

  test('updates parcel and active tickets together, preserving historical tickets and delivery amounts', async () => {
    const parcel = await fixture.parcel();
    const historical = await fixture.ticket(parcel.id, { ended: true, day: 2 });
    const active = await fixture.ticket(parcel.id);
    const secondActive = await fixture.ticket(parcel.id, { day: 1 });
    await reassign(input(parcel.id));
    expect((await readParcel(parcel.id)).shelfPickerStaffId).toBe(fixture.newPicker);
    expect((await readTicket(active.id)).pickerStaffId).toBe(fixture.newPicker);
    expect((await readTicket(secondActive.id)).pickerStaffId).toBe(fixture.newPicker);
    expect((await readTicket(historical.id)).pickerStaffId).toBe(fixture.oldPicker);
    expect((await readTicket(active.id)).queueCode).toBe(active.queueCode);
    expect((await readTicket(active.id)).endedAt).toBeNull();
    expect(await readParcel(parcel.id)).toMatchObject({
      status: parcel.status,
      chargePsw: parcel.chargePsw,
      plannedToBePaidPsw: parcel.plannedToBePaidPsw,
      confirmedAt: null,
    });
    const audit = await db.select().from(auditLogs).where(eq(auditLogs.entityId, parcel.id));
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      actorUserId: fixture.actor,
      action: 'PARCEL_SHELF_PICKER_REASSIGNED',
      metadata: { previousPickerStaffId: fixture.oldPicker, pickerStaffId: fixture.newPicker },
    });
    await expect(reassign(input(parcel.id))).rejects.toThrow('assignment changed');
    expect(
      (await reassign({ ...input(parcel.id), expectedPickerStaffId: fixture.newPicker })).changed,
    ).toBe(false);
    expect(await db.select().from(auditLogs).where(eq(auditLogs.entityId, parcel.id))).toHaveLength(
      1,
    );
  });

  test('works without queues and migrates an active legacy ticket assignment to the parcel', async () => {
    const noQueue = await fixture.parcel();
    await reassign(input(noQueue.id));
    expect((await readParcel(noQueue.id)).shelfPickerStaffId).toBe(fixture.newPicker);
    const legacy = await fixture.parcel(null);
    const ticket = await fixture.ticket(legacy.id);
    await reassign(input(legacy.id));
    expect((await readParcel(legacy.id)).shelfPickerStaffId).toBe(fixture.newPicker);
    expect((await readTicket(ticket.id)).pickerStaffId).toBe(fixture.newPicker);
  });

  test('rejects wrong scope, inactive staff, different-location staff, and delivered/deleted parcels', async () => {
    const parcel = await fixture.parcel();
    await expect(reassign({ ...input(parcel.id), companyId: createId() })).rejects.toThrow(
      'not found',
    );
    await expect(reassign({ ...input(parcel.id), branchId: createId() })).rejects.toThrow(
      'not found',
    );
    await expect(reassign({ ...input(parcel.id), locationId: createId() })).rejects.toThrow(
      'active staff',
    );
    await db
      .update(users)
      .set({ status: UserStatus.INVITED })
      .where(eq(users.id, fixture.secondPicker));
    await expect(reassign({ ...input(parcel.id), userId: fixture.secondPicker })).rejects.toThrow(
      'active staff',
    );
    const branchId = createId();
    await db.insert(branches).values({
      id: branchId,
      companyId: fixture.companyId,
      name: branchId,
      createdBy: fixture.actor,
    });
    await db
      .update(users)
      .set({ status: UserStatus.ACTIVE, branchId })
      .where(eq(users.id, fixture.secondPicker));
    await expect(reassign({ ...input(parcel.id), userId: fixture.secondPicker })).rejects.toThrow(
      'active staff',
    );
    await db
      .update(parcels)
      .set({ status: ParcelStatus.DELIVERED_BY_OFFICE })
      .where(eq(parcels.id, parcel.id));
    await expect(reassign(input(parcel.id))).rejects.toThrow('awaiting pickup');
    await db.update(parcels).set({ isDeleted: true }).where(eq(parcels.id, parcel.id));
    await expect(reassign(input(parcel.id))).rejects.toThrow('not found');
  });

  test('audit failure rolls back both parcel and ticket assignment', async () => {
    const parcel = await fixture.parcel();
    const ticket = await fixture.ticket(parcel.id);
    await expect(reassign({ ...input(parcel.id), actorUserId: createId() })).rejects.toThrow();
    expect((await readParcel(parcel.id)).shelfPickerStaffId).toBe(fixture.oldPicker);
    expect((await readTicket(ticket.id)).pickerStaffId).toBe(fixture.oldPicker);
  });

  test('two requests based on the same original picker cannot overwrite each other', async () => {
    const parcel = await fixture.parcel();
    const results = await Promise.allSettled([
      reassign(input(parcel.id)),
      reassign({ ...input(parcel.id), userId: fixture.actor }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(await db.select().from(auditLogs).where(eq(auditLogs.entityId, parcel.id))).toHaveLength(
      1,
    );
  });
});
