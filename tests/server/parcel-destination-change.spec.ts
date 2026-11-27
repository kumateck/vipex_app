import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  auditLogs,
  branches,
  consignmentItems,
  consignments,
  locations,
  parcels,
  payments,
  pickupQueues,
} from '@/db/schemas';
import { ParcelStatus, PaymentComponent } from '@/db/schemas/enums';
import type { AuthUser } from '@/server/plugins/auth';
import {
  assertParcelDestinationChangeAccess,
  changeParcelDestinationSvc,
  getParcelDestinationOptionsSvc,
} from '@/server/features/shipments/parcel-destination-change';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  getDestinationChangePhase,
  getDestinationChangeRestriction,
  normalizeDestinationChangeReason,
} from '@/shared/shipments/parcel-destination-change';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

const user = (permissions: string[]): AuthUser => ({
  sub: 'actor',
  email: 'test@example.test',
  companyId: 'company',
  branchId: 'any-branch',
  permissions,
});

describe('parcel destination change rules', () => {
  test('requires the dedicated permission', () => {
    expect(() => assertParcelDestinationChangeAccess({ user: null })).toThrow('Unauthorized');
    expect(() =>
      assertParcelDestinationChangeAccess({ user: user([PermissionKeys.CanUpdateParcels]) }),
    ).toThrow('Forbidden');
    expect(() =>
      assertParcelDestinationChangeAccess({
        user: user([PermissionKeys.CanChangeParcelDestination]),
      }),
    ).not.toThrow();
  });
  test('allows every stage before delivery except home delivery and return to source', () => {
    const base = { isDeleted: false, confirmed: false, hasPendingReceiverHandover: false };
    const phases: Record<number, string> = {
      0: 'pre_dispatch',
      1: 'pre_dispatch',
      2: 'in_transit',
      3: 'forward',
      4: 'forward',
      5: 'forward',
      12: 'forward',
      15: 'forward',
      16: 'forward',
    };
    for (let status = 0; status <= 20; status++) {
      const restriction = getDestinationChangeRestriction({ ...base, status });
      expect(getDestinationChangePhase(status) ?? null).toBe((phases[status] ?? null) as never);
      if (phases[status]) expect(restriction).toBeNull();
      else expect(restriction).toBeTruthy();
    }
    expect(getDestinationChangeRestriction({ ...base, status: 7 })).toContain('home delivery');
    expect(getDestinationChangeRestriction({ ...base, status: 5, isDeleted: true })).toBeTruthy();
    expect(getDestinationChangeRestriction({ ...base, status: 5, confirmed: true })).toBeTruthy();
    expect(
      getDestinationChangeRestriction({ ...base, status: 5, hasPendingReceiverHandover: true }),
    ).toContain('Receiver Cashier');
  });
  test('validates the reason length', () => {
    expect(normalizeDestinationChangeReason('  abc ')).toBeNull();
    expect(normalizeDestinationChangeReason('  wrong branch ')).toBe('wrong branch');
    expect(normalizeDestinationChangeReason('x'.repeat(501))).toBeNull();
  });
});

describe('parcel destination change service', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  const newBranchId = createId();
  const locationA = createId();
  const locationB = createId();
  const otherBranchId = createId();
  beforeAll(async () => {
    fixture = await createShelfPickupFixture();
    await db.insert(branches).values([
      { id: newBranchId, companyId: fixture.companyId, name: 'New', createdBy: fixture.actor },
      { id: otherBranchId, companyId: fixture.companyId, name: 'Old', createdBy: fixture.actor },
    ]);
    await db.insert(locations).values([
      {
        id: locationA,
        companyId: fixture.companyId,
        branchId: newBranchId,
        name: 'A',
        createdBy: fixture.actor,
      },
      {
        id: locationB,
        companyId: fixture.companyId,
        branchId: newBranchId,
        name: 'B',
        createdBy: fixture.actor,
      },
    ]);
  });
  afterAll(async () => {
    if (!fixture) return;
    const rows = await db
      .select({ id: consignments.id })
      .from(consignments)
      .where(eq(consignments.companyId, fixture.companyId));
    for (const row of rows)
      await db.delete(consignmentItems).where(eq(consignmentItems.consignmentId, row.id));
    await db.delete(consignments).where(eq(consignments.companyId, fixture.companyId));
    await db.delete(payments).where(eq(payments.companyId, fixture.companyId));
    await fixture.cleanup();
  });
  const newParcel = async (status: number = ParcelStatus.PROCESSED) => {
    const row = await fixture.parcel(null);
    await db
      .update(parcels)
      .set({ status, destinationId: otherBranchId, pickupLocationId: null })
      .where(eq(parcels.id, row.id));
    return row;
  };
  const change = (parcelId: string, overrides: Record<string, unknown> = {}) =>
    changeParcelDestinationSvc({
      parcelId,
      companyId: fixture.companyId,
      actorUserId: fixture.actor,
      destinationId: newBranchId,
      pickupLocationId: locationB,
      expectedDestinationId: otherBranchId,
      expectedPickupLocationId: null,
      reason: 'Customer moved to New',
      ...overrides,
    });

  test('lists other branches with receiving locations', async () => {
    const parcel = await newParcel();
    const options = await getParcelDestinationOptionsSvc({
      parcelId: parcel.id,
      companyId: fixture.companyId,
      actorUserId: fixture.actor,
    });
    expect(options.restriction).toBeNull();
    expect(options.branches.some((branch) => branch.id === fixture.branchId)).toBe(false);
    const target = options.branches.find((branch) => branch.id === newBranchId);
    expect(target?.locations.map((location) => location.id).sort()).toEqual(
      [locationA, locationB].sort(),
    );
  });

  test('changes destination and location and writes an audit entry', async () => {
    const parcel = await newParcel();
    expect(await change(parcel.id)).toEqual({ id: parcel.id, changed: true });
    const [saved] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    expect(saved?.destinationId).toBe(newBranchId);
    expect(saved?.pickupLocationId).toBe(locationB);
    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.entityId, parcel.id), eq(auditLogs.action, 'PARCEL_DESTINATION_CHANGED')),
      );
    expect(audit?.metadata).toMatchObject({
      previousDestinationId: otherBranchId,
      destinationId: newBranchId,
      pickupLocationId: locationB,
      reason: 'Customer moved to New',
    });
  });

  test('rejects ineligible, ambiguous, stale and source-branch changes', async () => {
    const homeDelivery = await newParcel(ParcelStatus.DISPATCHED);
    await expect(change(homeDelivery.id)).rejects.toThrow('home delivery');
    const delivered = await newParcel(ParcelStatus.DELIVERED_BY_OFFICE);
    await expect(change(delivered.id)).rejects.toThrow('before the parcel is delivered');
    const parcel = await newParcel();
    await expect(change(parcel.id, { pickupLocationId: null })).rejects.toThrow(
      'Select a pickup location',
    );
    await expect(change(parcel.id, { expectedDestinationId: newBranchId })).rejects.toThrow(
      'changed',
    );
    await expect(change(parcel.id, { destinationId: fixture.branchId })).rejects.toThrow(
      'differ from the source',
    );
    await expect(change(parcel.id, { reason: 'no' })).rejects.toThrow('reason');
    await expect(change(parcel.id, { companyId: createId() })).rejects.toThrow('not found');
  });

  const consign = async (parcelId: string) => {
    const [consignment] = await db
      .insert(consignments)
      .values({
        companyId: fixture.companyId,
        sourceId: fixture.branchId,
        destinationId: otherBranchId,
        consignmentDate: new Date(),
        serialForDay: 1,
        code: createId(),
        createdBy: fixture.actor,
      })
      .returning();
    await db.insert(consignmentItems).values({ consignmentId: consignment!.id, parcelId });
    return consignment!.id;
  };
  const activeItems = (parcelId: string) =>
    db
      .select()
      .from(consignmentItems)
      .where(and(eq(consignmentItems.parcelId, parcelId), isNull(consignmentItems.removedAt)));

  test('in-transit parcel leaves its consignment and stays in transit', async () => {
    const parcel = await newParcel(ParcelStatus.IN_TRANSIT);
    const consignmentId = await consign(parcel.id);
    expect(await change(parcel.id)).toMatchObject({ changed: true });
    const [saved] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    expect(saved?.status).toBe(ParcelStatus.IN_TRANSIT);
    expect(saved?.destinationId).toBe(newBranchId);
    expect(await activeItems(parcel.id)).toHaveLength(0);
    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.entityId, parcel.id), eq(auditLogs.action, 'PARCEL_DESTINATION_CHANGED')),
      );
    expect(audit?.metadata).toMatchObject({
      phase: 'in_transit',
      removedConsignmentId: consignmentId,
    });
  });

  test('arrived parcel is forwarded back to in transit with arrival state cleared', async () => {
    const parcel = await newParcel(ParcelStatus.AWAITING_PICKUP);
    await db
      .update(parcels)
      .set({
        receivedAt: new Date(),
        receivedBy: fixture.actor,
        shelfPickerStaffId: fixture.oldPicker,
      })
      .where(eq(parcels.id, parcel.id));
    const ticket = await fixture.ticket(parcel.id);
    expect(await change(parcel.id)).toMatchObject({ changed: true });
    const [saved] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    expect(saved).toMatchObject({
      status: ParcelStatus.IN_TRANSIT,
      destinationId: newBranchId,
      pickupLocationId: locationB,
      receivedAt: null,
      receivedBy: null,
      shelfPickerStaffId: null,
      receivingOfficeId: null,
    });
    const [queue] = await db.select().from(pickupQueues).where(eq(pickupQueues.id, ticket.id));
    expect(queue?.endedAt).not.toBeNull();
  });

  test('blocks forwarding once storage was paid at the current destination', async () => {
    const parcel = await newParcel(ParcelStatus.AWAITING_PICKUP);
    await db
      .update(parcels)
      .set({ receivedAt: new Date(Date.now() - 30 * 86400000) })
      .where(eq(parcels.id, parcel.id));
    await db.insert(payments).values({
      companyId: fixture.companyId,
      branchId: otherBranchId,
      parcelId: parcel.id,
      component: PaymentComponent.OTHER,
      cashierUserId: fixture.actor,
      grossAmountPsw: 500,
      netAmountPsw: 500,
      vatPsw: 0,
      getfundPsw: 0,
      nhilPsw: 0,
      covidPsw: 0,
      taxTotalPsw: 0,
      notes: 'STORAGE_CHARGE test',
    });
    await expect(change(parcel.id)).rejects.toThrow('Storage has already been paid');
    const options = await getParcelDestinationOptionsSvc({
      parcelId: parcel.id,
      companyId: fixture.companyId,
      actorUserId: fixture.actor,
    });
    expect(options.restriction).toContain('Storage');
    expect(options.branches).toHaveLength(0);
  });
});
