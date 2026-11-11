import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, customers, parcelReceiverOtps, parcels, pickupQueues } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { confirmOfficePickupSvc } from '@/server/features/shipments/parcel-services/confirm-office-pickup';
import {
  createPickupQueueSvc,
  listActivePickupQueuesForBranchSvc,
} from '@/server/features/pickup-queues/service';
import { listParcelsRepo } from '@/server/features/shipments/parcel-repositories/parcel-list.repository';
import { encodeHandoverSignature } from '@/shared/shipments/handover-signature';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

const signatureImage = encodeHandoverSignature(
  [
    [
      { x: 12, y: 30 },
      { x: 140, y: 100 },
    ],
  ],
  300,
  240,
);

describe('signed office pickup', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  beforeAll(async () => {
    fixture = await createShelfPickupFixture();
    await db
      .update(branches)
      .set({ requirePickupOtp: true, usePickupQueue: true })
      .where(eq(branches.id, fixture.branchId));
  });
  afterAll(async () => {
    if (!fixture) return;
    await db.delete(parcelReceiverOtps).where(eq(parcelReceiverOtps.companyId, fixture.companyId));
    await fixture.cleanup();
  });

  async function setup(day = 0) {
    const parcel = await fixture.parcel();
    await db
      .update(parcels)
      .set({ chargePsw: 0, plannedToBePaidPsw: 0, receivedAt: new Date() })
      .where(eq(parcels.id, parcel.id));
    const ticket = await fixture.ticket(parcel.id, { day });
    const [otp] = await db
      .insert(parcelReceiverOtps)
      .values({
        companyId: fixture.companyId,
        branchId: fixture.branchId,
        parcelId: parcel.id,
        targetReceiver: 'main',
        phone: '0240000000',
        otpHash: 'fixture',
        createdBy: fixture.actor,
        expiresAt: new Date(Date.now() + 60_000),
        verifiedAt: new Date(),
        verificationToken: parcel.id,
        verificationTokenExpiresAt: new Date(Date.now() + 60_000),
      })
      .returning();
    return {
      parcel,
      ticket,
      otp: otp!,
      input: {
        parcelId: parcel.id,
        companyId: fixture.companyId,
        branchId: fixture.branchId,
        locationId: fixture.locationId,
        actorUserId: fixture.actor,
        confirmedBy: fixture.oldPicker,
        handoverTarget: 'main' as const,
        signatureImage,
        expectedMainReceiverId: parcel.receiverId,
        expectedSecondReceiverId: null,
        secondReceiverId: null,
        cardId: null,
        cardNumber: null,
        secondCardId: null,
        secondCardNumber: null,
        receiverOtpVerificationToken: parcel.id,
      },
    };
  }

  test('reissues a previous-day ticket once and keeps it out of live queues and duplicate list rows', async () => {
    const { parcel, ticket: yesterday, input } = await setup(1);
    const createInput = { parcelId: parcel.id, queuedBy: fixture.actor, sendSms: false };
    const list = (queuedOnly?: true) =>
      listParcelsRepo({
        parcelId: parcel.id,
        status: ParcelStatus.AWAITING_PICKUP,
        hasPickupQueue: queuedOnly,
        limit: 20,
        offset: 0,
      });
    expect((await list()).data[0]?.pickupQueueId).toBeNull();
    expect((await list(true)).totalRecords).toBe(0);
    await expect(confirmOfficePickupSvc(input)).rejects.toThrow('Create a pickup queue ticket');
    const [today, retry] = await Promise.all([
      createPickupQueueSvc(createInput),
      createPickupQueueSvc(createInput),
    ]);
    expect(today.id).toBe(retry.id);
    expect(today.id).not.toBe(yesterday.id);
    expect((await list(true)).totalRecords).toBe(1);
    expect((await list()).data.map((row) => row.pickupQueueId)).toEqual([today.id]);
    expect(
      (await listActivePickupQueuesForBranchSvc(fixture.branchId)).map((row) => row.id),
    ).not.toContain(yesterday.id);
    await confirmOfficePickupSvc(input);
    const tickets = await db
      .select()
      .from(pickupQueues)
      .where(eq(pickupQueues.parcelId, parcel.id));
    expect(tickets).toHaveLength(2);
    expect(tickets.every((ticket) => ticket.endedAt !== null)).toBe(true);
  });

  test('rejects missing signatures and out-of-branch requests without consuming OTP or ending the queue', async () => {
    const { parcel, ticket, otp, input } = await setup();
    await expect(confirmOfficePickupSvc({ ...input, signatureImage: '' })).rejects.toThrow(
      'signature',
    );
    await expect(confirmOfficePickupSvc({ ...input, branchId: fixture.companyId })).rejects.toThrow(
      'not found',
    );
    await expect(
      confirmOfficePickupSvc({ ...input, receiverOtpVerificationToken: 'invalid' }),
    ).rejects.toThrow('verification');
    const [saved] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    const [queue] = await db.select().from(pickupQueues).where(eq(pickupQueues.id, ticket.id));
    const [verified] = await db
      .select()
      .from(parcelReceiverOtps)
      .where(eq(parcelReceiverOtps.id, otp.id));
    expect(saved?.status).toBe(ParcelStatus.AWAITING_PICKUP);
    expect(saved?.deliveryConfirmationSnapshot).toBeNull();
    expect(queue?.endedAt).toBeNull();
    expect(verified?.verificationToken).toBe(parcel.id);
  });

  test('records the second collector and only completes a duplicate submission once', async () => {
    const { parcel, ticket, otp, input } = await setup();
    const [collector] = await db
      .insert(customers)
      .values({
        companyId: fixture.companyId,
        fullname: 'Second collector',
        createdBy: fixture.actor,
      })
      .returning();
    const signed = { ...input, handoverTarget: 'second' as const, secondReceiverId: collector!.id };
    const outcomes = await Promise.allSettled([
      confirmOfficePickupSvc(signed),
      confirmOfficePickupSvc(signed),
    ]);
    expect(outcomes.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    const [saved] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    const [queue] = await db.select().from(pickupQueues).where(eq(pickupQueues.id, ticket.id));
    const [verified] = await db
      .select()
      .from(parcelReceiverOtps)
      .where(eq(parcelReceiverOtps.id, otp.id));
    expect(saved?.status).toBe(ParcelStatus.DELIVERED_BY_OFFICE);
    expect(saved?.secondReceiverId).toBe(collector!.id);
    expect(saved?.deliveryConfirmationSnapshot).toMatchObject({
      paymentIds: [],
      pickupQueueId: ticket.id,
      officePickupSignature: {
        handoverTarget: 'second',
        customerId: collector!.id,
        signatureImage,
        capturedBy: fixture.actor,
      },
    });
    expect(queue?.endedAt).toBeInstanceOf(Date);
    expect(verified?.verificationToken).toBeNull();
  });

  test('requires a fresh signature after the linked second receiver is removed', async () => {
    const { parcel, input } = await setup();
    const [collector] = await db
      .insert(customers)
      .values({
        companyId: fixture.companyId,
        fullname: 'Previous collector',
        createdBy: fixture.actor,
      })
      .returning();
    await expect(
      confirmOfficePickupSvc({
        ...input,
        handoverTarget: 'second',
        expectedSecondReceiverId: collector!.id,
        secondReceiverId: collector!.id,
      }),
    ).rejects.toThrow('Receiver changed');
    const [saved] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    expect(saved?.deliveryConfirmationSnapshot).toBeNull();
    expect(saved?.secondReceiverId).toBeNull();
  });
});
