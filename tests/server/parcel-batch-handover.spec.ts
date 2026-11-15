import { afterAll, beforeAll, describe, expect, spyOn, test } from 'bun:test';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '@/db/config';
import {
  branches,
  cashierSessions,
  customers,
  parcelReceiverOtps,
  parcels,
  payments,
  pickupQueues,
  rolePermissions,
} from '@/db/schemas';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import * as notifications from '@/server/features/notification-hub/service';
import { parcelBatchHandoverRoutes } from '@/server/features/parcel-batch-handover';
import { confirmBatchHandover } from '@/server/features/parcel-batch-handover/confirm';
import { requestBatchOtp, verifyBatchOtp } from '@/server/features/parcel-batch-handover/otp';
import { searchBatchParcels } from '@/server/features/parcel-batch-handover/search';
import type { BatchActor } from '@/server/features/parcel-batch-handover/selection';
import {
  getActiveParcelReceiverOtpRepo,
  getVerifiedOtpByTokenRepo,
} from '@/server/features/parcel-receiver-otp/repository';
import { getReceiverOtpSession } from '@/server/features/parcel-receiver-otp/session.service';
import { errorHandler } from '@/server/middlewares/error-handler';
import { PermissionKeys } from '@/shared/permissions/constants';
import { encodeHandoverSignature } from '@/shared/shipments/handover-signature';
import type { BatchHandoverWorkflow } from '@/shared/shipments/parcel-batch-handover';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';
import { createTestAccessToken } from '../utils/auth-session';

const app = new Elysia()
  .use(errorHandler)
  .group('/payments', (route) => route.use(parcelBatchHandoverRoutes));
const telephone = '0241234567';
const signatureImage = encodeHandoverSignature(
  [
    [
      { x: 3, y: 5 },
      { x: 22, y: 30 },
    ],
  ],
  90,
  50,
);
const signature = { source: 'touchscreen' as const, signatureImage };

describe('batch parcel handover', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  beforeAll(async () => {
    fixture = await createShelfPickupFixture();
    await db
      .update(customers)
      .set({ telephone: '+233 24 123 4567' })
      .where(eq(customers.companyId, fixture.companyId));
    await db
      .update(branches)
      .set({
        usePickupQueue: true,
        requirePickupOtp: true,
        requireReceiverOtp: true,
        requireReceiverCashierSignature: true,
      })
      .where(eq(branches.id, fixture.branchId));
    await db.insert(cashierSessions).values({
      cashierId: fixture.actor,
      branchId: fixture.branchId,
      scheduledStartTime: new Date(),
      scheduledEndTime: new Date(Date.now() + 86_400_000),
      status: 'ACTIVE',
    });
    await db.insert(rolePermissions).values({
      companyId: fixture.companyId,
      roleId: fixture.roleId,
      permission: PermissionKeys.CanCompleteOfficePickup,
    });
  });

  afterAll(async () => {
    if (!fixture) return;
    await db.delete(parcelReceiverOtps).where(eq(parcelReceiverOtps.companyId, fixture.companyId));
    await db.delete(payments).where(eq(payments.companyId, fixture.companyId));
    await db.delete(cashierSessions).where(eq(cashierSessions.cashierId, fixture.actor));
    await fixture.cleanup();
  });

  function actor(workflow: BatchHandoverWorkflow): BatchActor {
    return {
      companyId: fixture.companyId,
      branchId: fixture.branchId,
      locationId: fixture.locationId,
      actorId: fixture.actor,
      workflow,
    };
  }

  async function setup(principalPsw: number) {
    const rows = (await Promise.all([fixture.parcel(), fixture.parcel(), fixture.parcel()])).sort(
      (a, b) => a.id.localeCompare(b.id),
    );
    const ids = rows.map(({ id }) => id);
    await db
      .update(parcels)
      .set({ chargePsw: principalPsw, plannedToBePaidPsw: principalPsw, receivedAt: new Date() })
      .where(inArray(parcels.id, ids));
    const tickets = await Promise.all(rows.map(({ id }) => fixture.ticket(id)));
    return {
      ids,
      tickets,
      selection: {
        telephone,
        items: rows
          .slice(0, 2)
          .map(({ id, receiverId }) => ({ id, receiverId, principalPsw, storagePsw: 0 })),
      },
    };
  }

  async function sendOtp(
    scope: BatchActor,
    selection: Awaited<ReturnType<typeof setup>>['selection'],
  ) {
    const send = spyOn(notifications, 'dispatchSmsEventSvc').mockImplementation(async () => ({
      status: 'sent',
    }));
    try {
      const session = await requestBatchOtp(scope, { ...selection, channel: 'sms' });
      expect(send).toHaveBeenCalledTimes(1);
      const message = send.mock.calls[0]![0];
      expect(message.phone).toBe(telephone);
      expect(message.metadataJson?.parcelIds).toHaveLength(2);
      return { session, otp: String(message.variables.otp) };
    } finally {
      send.mockRestore();
    }
  }

  test('searches only the matched receiver and applies permission to each route', async () => {
    const { ids } = await setup(0);
    const [other] = await db
      .insert(customers)
      .values({
        fullname: 'Unrelated receiver',
        telephone: '0249876543',
        companyId: fixture.companyId,
        createdBy: fixture.actor,
      })
      .returning();
    await db.update(parcels).set({ receiverId: other!.id }).where(eq(parcels.id, ids[2]!));
    const result = await searchBatchParcels(actor('office-pickup'), {
      telephone: '+233 24 123 4567',
    });
    expect(result.rows.map(({ id }) => id)).toEqual(ids.slice(0, 2));
    const token = await createTestAccessToken({
      userId: fixture.actor,
      email: `${fixture.actor}@example.test`,
      roleId: fixture.roleId,
      companyId: fixture.companyId,
      branchId: fixture.branchId,
      locationId: fixture.locationId,
      permissions: [],
    });
    const endpoint = (flow: BatchHandoverWorkflow) =>
      new Request(`http://localhost/payments/${flow}-batch-handover?telephone=${telephone}`, {
        headers: { authorization: `Bearer ${token}` },
      });
    expect((await app.handle(endpoint('office-pickup'))).status).toBe(200);
    expect((await app.handle(endpoint('receiver-cashier'))).status).toBe(403);
  });

  test('isolates one OTP and signature to the exact office selection, including under retries', async () => {
    const scope = actor('office-pickup');
    const { ids, selection } = await setup(0);
    const { session, otp } = await sendOtp(scope, selection);
    const parcelId = selection.items[0]!.id;
    expect(await getActiveParcelReceiverOtpRepo(parcelId, 'main')).toBeNull();
    expect(
      await getReceiverOtpSession({
        ...scope,
        actorUserId: scope.actorId,
        parcelId,
        targetReceiver: 'main',
      }),
    ).toBeNull();
    await expect(
      verifyBatchOtp({ ...scope, actorId: fixture.oldPicker }, { id: session.id, otp }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      verifyBatchOtp(scope, { id: session.id, otp: otp === '100000' ? '100001' : '100000' }),
    ).rejects.toThrow('Invalid OTP');
    const proof = await verifyBatchOtp(scope, { id: session.id, otp });
    expect(await getVerifiedOtpByTokenRepo(parcelId, 'main', proof.verificationToken)).toBeNull();
    const input = { ...selection, ...proof, id: session.id, signature };
    const [unselected] = await db.select().from(parcels).where(eq(parcels.id, ids[2]!));
    await expect(
      confirmBatchHandover(scope, {
        ...input,
        items: [selection.items[0]!, { ...selection.items[1]!, id: unselected!.id }],
      }),
    ).rejects.toMatchObject({ status: 403 });
    const outcomes = await Promise.all([
      confirmBatchHandover(scope, input),
      confirmBatchHandover(scope, { ...input, items: [...input.items].reverse() }),
    ]);
    expect(outcomes.map(({ alreadyConfirmed }) => alreadyConfirmed).sort()).toEqual([false, true]);
    const rows = await db
      .select()
      .from(parcels)
      .where(inArray(parcels.id, ids))
      .orderBy(asc(parcels.id));
    expect(rows.map(({ status }) => status)).toEqual([
      ParcelStatus.DELIVERED_BY_OFFICE,
      ParcelStatus.DELIVERED_BY_OFFICE,
      ParcelStatus.AWAITING_PICKUP,
    ]);
    for (const row of rows.slice(0, 2))
      expect(row.deliveryConfirmationSnapshot).toMatchObject({
        batchHandoverId: session.id,
        officePickupSignature: {
          signatureImage,
          customerId: row.receiverId,
          capturedBy: scope.actorId,
        },
      });
    const queues = await db.select().from(pickupQueues).where(inArray(pickupQueues.parcelId, ids));
    expect(
      queues
        .filter(({ endedAt }) => endedAt)
        .map((queue) => queue.parcelId)
        .sort(),
    ).toEqual(ids.slice(0, 2));
  });

  test('rolls back all cashier charges and deliveries when a selected ticket changes', async () => {
    const scope = actor('receiver-cashier');
    const { ids, selection, tickets } = await setup(1000);
    const found = await searchBatchParcels(scope, { telephone });
    expect(found.rows.map(({ id, principalPsw }) => [id, principalPsw])).toEqual(
      ids.map((id) => [id, 1000]),
    );
    const { session, otp } = await sendOtp(scope, selection);
    const proof = await verifyBatchOtp(scope, { id: session.id, otp });
    const input = {
      ...selection,
      ...proof,
      id: session.id,
      signature,
      paymentMethod: 'telecel' as const,
    };
    const ticket = tickets[1]!;
    const handoverPayments = () =>
      db
        .select()
        .from(payments)
        .where(and(eq(payments.companyId, fixture.companyId), inArray(payments.parcelId, ids)));
    await db
      .update(pickupQueues)
      .set({ endedAt: new Date() })
      .where(eq(pickupQueues.id, ticket.id));
    await expect(confirmBatchHandover(scope, input)).rejects.toThrow('Issue a pickup ticket');
    expect(await handoverPayments()).toHaveLength(0);
    const waiting = await db.select().from(parcels).where(inArray(parcels.id, ids));
    expect(waiting.every((row) => row.status === ParcelStatus.AWAITING_PICKUP)).toBe(true);
    await db.update(pickupQueues).set({ endedAt: null }).where(eq(pickupQueues.id, ticket.id));
    expect(await confirmBatchHandover(scope, input)).toMatchObject({ alreadyConfirmed: false });
    expect(await confirmBatchHandover(scope, input)).toMatchObject({ alreadyConfirmed: true });
    const posted = await handoverPayments();
    expect(posted.map(({ parcelId }) => parcelId).sort()).toEqual(ids.slice(0, 2));
    expect(
      posted.every(
        ({ grossAmountPsw, method }) =>
          Number(grossAmountPsw) === 1000 && method === PaymentMethod.TELECEL,
      ),
    ).toBe(true);
    const delivered = await db
      .select()
      .from(parcels)
      .where(inArray(parcels.id, ids.slice(0, 2)));
    expect(delivered.every((row) => row.pendingReceiverHandover === null)).toBe(true);
    for (const row of delivered)
      expect(row.deliveryConfirmationSnapshot).toMatchObject({
        batchHandoverId: session.id,
        receiverCashierSignature: {
          signatureImage,
          collectorId: row.receiverId,
          handoverId: session.id,
        },
      });
  });
});
