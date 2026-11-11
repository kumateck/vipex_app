import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '@/db/config';
import { auditLogs, branches, parcels, rolePermissions, roles, users } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { AuthUser } from '@/server/plugins/auth';
import { errorHandler } from '@/server/middlewares/error-handler';
import {
  getParcelHandoverNote,
  saveParcelHandoverNote,
} from '@/server/features/shipments/handover-note/service';
import { getParcelRepo, listParcelsRepo } from '@/server/features/shipments/parcels.repository';
import { parcelsRoutes } from '@/server/features/shipments/parcels.routes';
import { listActivePickupQueueCardsForBranchSvc } from '@/server/features/pickup-queues/service';
import { createTestAccessToken } from '../utils/auth-session';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

const app = new Elysia()
  .use(errorHandler)
  .group('/v1/shipments/parcels', (routes) => routes.use(parcelsRoutes));

describe('critical parcel handover notes', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  const destinationId = createId();
  const sourceUser = (): AuthUser => ({
    sub: fixture.actor,
    email: 'handover-note-test@example.com',
    companyId: fixture.companyId,
    branchId: fixture.branchId,
    permissions: [PermissionKeys.CanUpdateParcelHandoverNote],
  });
  const destinationUser = (): AuthUser => ({
    ...sourceUser(),
    branchId: destinationId,
    permissions: [PermissionKeys.CanReadParcelScan],
  });

  beforeAll(async () => {
    fixture = await createShelfPickupFixture();
    await db.insert(branches).values({
      id: destinationId,
      name: 'Receiving branch',
      companyId: fixture.companyId,
      createdBy: fixture.actor,
    });
  });
  afterAll(async () => {
    if (fixture) await fixture.cleanup();
  });

  const newParcel = async (status: number, destination = destinationId) => {
    const row = await fixture.parcel();
    await db
      .update(parcels)
      .set({ status, destinationId: destination })
      .where(eq(parcels.id, row.id));
    return row;
  };
  const save = (id: string, note = 'Call the sender before handing over the parcel.') =>
    saveParcelHandoverNote({ id, note, expectedNote: null, user: sourceUser() });

  test('source saves an audited note and the destination can find and read it before arrival', async () => {
    const row = await newParcel(ParcelStatus.IN_TRANSIT);
    const sibling = await newParcel(ParcelStatus.IN_TRANSIT);
    await db
      .update(parcels)
      .set({ bookingCode: row.bookingCode })
      .where(eq(parcels.id, sibling.id));
    const saved = await save(row.id, '  Verify the receiver’s reference first.  ');
    expect(saved).toEqual({
      note: 'Verify the receiver’s reference first.',
      critical: true,
      canEdit: true,
    });
    expect(await getParcelHandoverNote(row.id, destinationUser())).toEqual({
      ...saved,
      canEdit: false,
    });
    const lookup = await listParcelsRepo({
      companyId: fixture.companyId,
      destinationId,
      status: ParcelStatus.IN_TRANSIT,
      parcelCode: row.bookingCode,
      limit: 20,
      offset: 0,
    });
    expect(lookup.data.find((entry) => entry.id === row.id)).toMatchObject({
      hasHandoverNote: true,
      handoverNoteCritical: true,
    });
    expect(lookup.data.find((entry) => entry.id === sibling.id)).toMatchObject({
      hasHandoverNote: false,
      handoverNoteCritical: false,
    });
    expect(lookup.data[0]).not.toHaveProperty('handoverNote');
    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.entityId, row.id), eq(auditLogs.action, 'PARCEL_HANDOVER_NOTE_SAVED')),
      );
    expect(audit?.actorUserId).toBe(fixture.actor);
  });

  test.each([
    ParcelStatus.DELIVERED_BY_OFFICE,
    ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
    ParcelStatus.DELIVERED_AT_HOME,
  ])(
    'delivery status %s keeps the note and permanently clears the alert through reversal',
    async (status) => {
      const row = await newParcel(ParcelStatus.AWAITING_PICKUP);
      const saved = await save(row.id);
      await db.update(parcels).set({ status }).where(eq(parcels.id, row.id));
      expect(await getParcelRepo(row.id)).toMatchObject({
        hasHandoverNote: true,
        handoverNoteCritical: false,
        handoverNoteEditable: false,
      });
      await db
        .update(parcels)
        .set({ status: ParcelStatus.AWAITING_PICKUP, handoverNoteClearedAt: null })
        .where(eq(parcels.id, row.id));
      expect(await getParcelHandoverNote(row.id, sourceUser())).toEqual({
        ...saved,
        critical: false,
        canEdit: false,
      });
      expect(await getParcelRepo(row.id)).toMatchObject({ handoverNoteEditable: false });
      await expect(
        saveParcelHandoverNote({
          id: row.id,
          note: 'New instruction',
          expectedNote: saved.note,
          user: sourceUser(),
        }),
      ).rejects.toMatchObject({ status: 409 });
    },
  );

  test('pickup queue cards include the critical indicator', async () => {
    const row = await newParcel(ParcelStatus.AWAITING_PICKUP, fixture.branchId);
    await fixture.ticket(row.id);
    await save(row.id);
    const queue = await listActivePickupQueueCardsForBranchSvc({ branchId: fixture.branchId });
    expect(queue.find((card) => card.parcelId === row.id)).toMatchObject({
      hasHandoverNote: true,
      handoverNoteCritical: true,
    });
  });

  test('mounted endpoint lets source staff save and destination scan staff read before arrival', async () => {
    const { actor, oldPicker, roleId, companyId } = fixture;
    const readerRole = createId();
    await db
      .insert(roles)
      .values({ id: readerRole, companyId, name: readerRole, createdBy: actor });
    await db.insert(rolePermissions).values([
      { roleId, companyId, permission: PermissionKeys.CanUpdateParcelHandoverNote },
      { roleId: readerRole, companyId, permission: PermissionKeys.CanReadParcelScan },
      { roleId: readerRole, companyId, permission: PermissionKeys.CanCreateReceiverPayments },
    ]);
    await db
      .update(users)
      .set({ roleId: readerRole, branchId: destinationId })
      .where(eq(users.id, oldPicker));
    const sign = (id: string) =>
      createTestAccessToken({ userId: id, email: `${id}@example.test`, permissions: [] });
    const [writer, reader] = await Promise.all([sign(actor), sign(oldPicker)]);
    const row = await newParcel(ParcelStatus.IN_TRANSIT);
    const url = `http://localhost/v1/shipments/parcels/${row.id}/handover-note`;
    const request = (token: string, note?: string) =>
      app.handle(
        new Request(url, {
          method: note === undefined ? 'GET' : 'PATCH',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: note === undefined ? undefined : JSON.stringify({ note, expectedNote: null }),
        }),
      );
    const note = 'Check the recipient’s reference number.';
    expect((await request('')).status).toBe(401);
    expect((await request(reader, note)).status).toBe(403);
    expect((await request(writer, note)).status).toBe(200);
    const result = await request(reader);
    expect(result.status).toBe(200);
    expect(result.headers.get('cache-control')).toBe('no-store');
    expect(await result.json()).toEqual({ note, critical: true, canEdit: false });

    await db
      .update(parcels)
      .set({ status: ParcelStatus.AWAITING_PICKUP })
      .where(eq(parcels.id, row.id));
    const cashierUrl = `http://localhost/v1/shipments/parcels/receiver-cashier-queue?search=${row.bookingCode}`;
    const cashierRequest = (token: string) =>
      app.handle(new Request(cashierUrl, { headers: { authorization: `Bearer ${token}` } }));
    expect((await cashierRequest(writer)).status).toBe(403);
    const cashierList = await cashierRequest(reader);
    expect(cashierList.status).toBe(200);
    expect(await cashierList.json()).toMatchObject({
      data: [{ id: row.id, handoverNoteCritical: true }],
    });
  });

  test('validates company, branch, edit permission, note text and stale edits', async () => {
    const row = await newParcel(ParcelStatus.IN_TRANSIT);
    await expect(save(row.id, ' ')).rejects.toMatchObject({ status: 400 });
    await expect(save(row.id, 'x'.repeat(1001))).rejects.toMatchObject({ status: 400 });
    await expect(
      saveParcelHandoverNote({
        id: row.id,
        note: 'Instruction',
        expectedNote: null,
        user: destinationUser(),
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      getParcelHandoverNote(row.id, { ...destinationUser(), branchId: 'other-branch' }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      getParcelHandoverNote(row.id, { ...destinationUser(), companyId: 'other-company' }),
    ).rejects.toMatchObject({ status: 404 });
    await save(row.id);
    await expect(save(row.id, 'Stale edit')).rejects.toMatchObject({ status: 409 });
  });
});
