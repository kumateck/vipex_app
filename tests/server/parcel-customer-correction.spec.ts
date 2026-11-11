import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db, sql, closeSql } from '@/db/config';
import {
  auditLogs,
  customers,
  customerCreditTransactions,
  deliveries,
  parcels,
  parcelReceiverOtps,
} from '@/db/schemas';
import {
  correctParcelCustomer,
  findCorrectionCustomers,
  findCorrectionParcels,
} from '@/server/features/shipments/customer-corrections';
import {
  getActiveParcelReceiverOtpRepo,
  getVerifiedOtpByTokenRepo,
} from '@/server/features/parcel-receiver-otp/repository';
import { createCustomerCorrectionFixture } from '../utils/customer-correction-fixture';
import { correctionHttpSession } from '../utils/customer-correction-http';
import { PermissionKeys } from '@/shared/permissions/constants';

describe.skipIf(process.env.PARCEL_CUSTOMER_CORRECTION_TEST !== '1')(
  'parcel customer corrections persistence',
  () => {
    let fixture: Awaited<ReturnType<typeof createCustomerCorrectionFixture>>;
    beforeAll(async () => {
      fixture = await createCustomerCorrectionFixture();
    });
    beforeEach(async () => {
      await fixture.reset();
    });
    afterAll(async () => {
      if (fixture) await fixture.cleanup();
      await closeSql();
    });

    const relinkInput = async () => {
      const [replacement] = await findCorrectionCustomers('company', '0540345785');
      return fixture.input({
        mode: 'relink',
        customerId: replacement!.id,
        replacementVersion: replacement!.version,
        telephone: '0540345785',
      });
    };
    const parcel = async (id = 'parcel-a') =>
      (await db.select().from(parcels).where(eq(parcels.id, id)))[0]!;

    test('booking code finds every parcel and exact customer lookup stays company scoped', async () => {
      expect(await findCorrectionParcels('company', ' KN3432637L ')).toHaveLength(2);
      await expect(findCorrectionParcels('another-company', 'KN3432637L')).rejects.toMatchObject({
        status: 404,
      });
      expect(await findCorrectionCustomers('company', '0243333333')).toHaveLength(1);
      expect((await findCorrectionCustomers('company', '0540345785'))[0]?.id).toBe('correct');
    });
    test('authenticated HTTP lookup and correction enforce mode permissions across branches', async () => {
      const relinkOnly = await correctionHttpSession([PermissionKeys.CanCorrectParcelCustomers]);
      const lookup = await relinkOnly('/lookup?bookingCode=KN3432637L');
      expect(lookup.status).toBe(200);
      expect(await lookup.json()).toHaveLength(2);
      const { parcelId, ...profileBody } = await fixture.input();
      expect((await relinkOnly(`/${parcelId}`, profileBody)).status).toBe(403);
      const profileOnly = await correctionHttpSession([
        PermissionKeys.CanOverrideParcelCustomerDetails,
      ]);
      const { parcelId: target, ...relinkBody } = await relinkInput();
      expect((await profileOnly(`/${target}`, relinkBody)).status).toBe(403);
      const saved = await relinkOnly(`/${target}`, relinkBody);
      expect(saved.status).toBe(200);
      expect((await saved.json()).parties.receiver.telephone).toBe('0540345785');
      const { parcelId: correctedId, ...correctionBody } = await fixture.input();
      expect((await profileOnly(`/${correctedId}`, correctionBody)).status).toBe(200);
    });
    test('relinks a receiver after the call outcome, preserves status and other parcels, and targets the correct OTP phone', async () => {
      const before = await parcel();
      const other = await parcel('parcel-b');
      const profiles = await db.select().from(customers).orderBy(customers.id);
      await fixture.otp();
      await fixture.otp('second', '0242222222');
      const saved = await correctParcelCustomer(await relinkInput());
      expect(saved.parties.receiver).toMatchObject({
        id: 'correct',
        recordedName: 'Bright Lawson',
        telephone: '0540345785',
      });
      expect(saved.parties.secondReceiver).toBeUndefined();
      expect(await parcel('parcel-b')).toEqual(other);
      expect(await db.select().from(customers).orderBy(customers.id)).toEqual(profiles);
      const after = await parcel();
      expect(after.status).toBe(before.status);
      expect(after.chargePsw).toBe(before.chargePsw);
      expect(after.trackingCode).toBe(before.trackingCode);
      expect(after.callCenterCalledAt).toEqual(before.callCenterCalledAt);
      expect(await getActiveParcelReceiverOtpRepo(before.id, 'main')).toBeNull();
      expect(await getVerifiedOtpByTokenRepo(before.id, 'main', 'old-token')).toBeNull();
      expect(await getActiveParcelReceiverOtpRepo(before.id, 'second')).toBeNull();
      await fixture.otp('main', '0540345785');
      expect((await getActiveParcelReceiverOtpRepo(before.id, 'main'))?.phone).toBe('0540345785');
    });
    test('profile corrections save all three party snapshots without rewriting other parcel names', async () => {
      for (const party of ['sender', 'receiver', 'secondReceiver'] as const) {
        await fixture.reset();
        const before = await parcel('parcel-b');
        const result = await correctParcelCustomer(await fixture.input({ party }));
        expect(result.parties[party]).toMatchObject({
          fullname: 'Corrected Customer',
          recordedName: 'Corrected Customer',
          telephone: '0245555555',
        });
        const after = await parcel('parcel-b');
        expect(after.senderNameSnapshot).toBe(before.senderNameSnapshot);
        expect(after.receiverNameSnapshot).toBe(before.receiverNameSnapshot);
        expect(after.secondReceiverNameSnapshot).toBe(before.secondReceiverNameSnapshot);
      }
    });
    test('profile changes invalidate codes and tokens on every parcel using that receiver', async () => {
      await fixture.otp();
      await fixture.otp('main', '0540345985', 'parcel-b');
      await correctParcelCustomer(await fixture.input());
      for (const id of ['parcel-a', 'parcel-b']) {
        expect(await getActiveParcelReceiverOtpRepo(id, 'main')).toBeNull();
        expect(await getVerifiedOtpByTokenRepo(id, 'main', 'old-token')).toBeNull();
      }
      const [profile] = await db.select().from(customers).where(eq(customers.id, 'receiver'));
      expect(profile?.telephone).toBe('0245555555');
    });
    test('phone-only corrections preserve a newer profile name and the recorded parcel name', async () => {
      await db
        .update(customers)
        .set({ fullname: 'Newer Profile Name' })
        .where(eq(customers.id, 'receiver'));
      const result = await correctParcelCustomer(
        await fixture.input({ updateName: false, fullname: 'Ignored Name' }),
      );
      expect(result.parties.receiver).toMatchObject({
        fullname: 'Newer Profile Name',
        recordedName: 'Wrong Receiver',
        telephone: '0245555555',
      });
    });
    test('racing resend to the old phone cannot authorize pickup after the correction', async () => {
      await correctParcelCustomer(await relinkInput());
      await fixture.otp();
      expect(await getActiveParcelReceiverOtpRepo('parcel-a', 'main')).toBeNull();
      expect(await getVerifiedOtpByTokenRepo('parcel-a', 'main', 'old-token')).toBeNull();
    });
    test('current main receiver secondary-phone OTPs remain supported', async () => {
      await correctParcelCustomer(await relinkInput());
      await fixture.otp('main', '0243333333');
      expect((await getActiveParcelReceiverOtpRepo('parcel-a', 'main'))?.phone).toBe('0243333333');
      expect(await getVerifiedOtpByTokenRepo('parcel-a', 'main', 'old-token')).not.toBeNull();
    });
    test('relink clears pending handover context under the production constraint', async () => {
      await sql`update parcels set pending_receiver_handover=${JSON.stringify({
        id: 'pending',
        companyId: 'company',
        branchId: 'accra',
        receiverId: 'receiver',
        collectorId: 'receiver',
        handoverTarget: 'main',
      })}::jsonb where id='parcel-a'`;
      await correctParcelCustomer(await relinkInput());
      expect((await parcel()).pendingReceiverHandover).toBeNull();
    });
    test('rejects duplicate primary and secondary phones with no partial updates', async () => {
      for (const telephone of ['0540345785', '0243333333']) {
        const before = await parcel();
        await expect(
          correctParcelCustomer(await fixture.input({ telephone })),
        ).rejects.toMatchObject({ status: 409 });
        expect(await parcel()).toEqual(before);
        expect(await db.select().from(auditLogs)).toHaveLength(0);
      }
    });
    test('rejects foreign customers, stale parcels and stale customer profiles', async () => {
      const input = await relinkInput();
      await expect(
        correctParcelCustomer({ ...input, customerId: 'foreign' }),
      ).rejects.toMatchObject({ status: 409 });
      await expect(
        correctParcelCustomer({ ...input, companyId: 'another-company' }),
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        correctParcelCustomer({ ...input, expectedVersion: 'stale' }),
      ).rejects.toMatchObject({ status: 409 });
      await db
        .update(customers)
        .set({ fullname: 'Renamed elsewhere' })
        .where(eq(customers.id, 'receiver'));
      await expect(correctParcelCustomer(input)).rejects.toMatchObject({ status: 409 });
    });
    test('delivery and handover cutoffs are enforced at save time', async () => {
      const input = await fixture.input();
      for (const status of [6, 10, 11, 13, 14, 17, 18, 19]) {
        await db.update(parcels).set({ status }).where(eq(parcels.id, 'parcel-a'));
        await expect(correctParcelCustomer(input)).rejects.toMatchObject({ status: 409 });
      }
      await db
        .update(parcels)
        .set({ status: 5, confirmedAt: new Date() })
        .where(eq(parcels.id, 'parcel-a'));
      await expect(correctParcelCustomer(input)).rejects.toMatchObject({ status: 409 });
    });
    test('an already completed delivery row also blocks correction', async () => {
      await db
        .insert(deliveries)
        .values({ parcelId: 'parcel-a', riderCompletedAt: new Date(), createdBy: 'actor' });
      await expect(correctParcelCustomer(await fixture.input())).rejects.toMatchObject({
        status: 409,
      });
    });
    test('relink does not move customer credit history', async () => {
      await db.insert(customerCreditTransactions).values({
        companyId: 'company',
        customerId: 'receiver',
        referenceId: 'parcel-a',
        signedAmountPsw: 100,
        createdBy: 'actor',
      });
      await expect(correctParcelCustomer(await relinkInput())).rejects.toMatchObject({
        status: 409,
      });
      expect((await parcel()).receiverId).toBe('receiver');
    });
    test('simultaneous corrections using the same preview commit only once', async () => {
      const input = await fixture.input();
      const results = await Promise.allSettled([
        correctParcelCustomer(input),
        correctParcelCustomer(input),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(
        (await db.select().from(auditLogs)).filter((row) => row.entityType === 'parcel'),
      ).toHaveLength(1);
    });
    test('an audit failure rolls back customer, parcel and pickup credentials together', async () => {
      await fixture.otp();
      const before = await parcel();
      const beforeOtp = await db.select().from(parcelReceiverOtps);
      await sql`alter table audit_logs add constraint reject_correction check (action <> 'PARCEL_CUSTOMER_CORRECTED')`;
      try {
        await expect(correctParcelCustomer(await fixture.input())).rejects.toThrow();
        expect(await parcel()).toEqual(before);
        expect(await db.select().from(parcelReceiverOtps)).toEqual(beforeOtp);
        expect(await db.select().from(auditLogs)).toHaveLength(0);
      } finally {
        await sql`alter table audit_logs drop constraint reject_correction`;
      }
    });
    test('old name-capture trigger causes the entire sender correction to roll back', async () => {
      await sql.unsafe(await Bun.file('drizzle/0081_parcel_receiver_name_corrections.sql').text());
      try {
        const before = await parcel();
        await expect(
          correctParcelCustomer(await fixture.input({ party: 'sender' })),
        ).rejects.toMatchObject({ status: 409 });
        expect(await parcel()).toEqual(before);
        expect(await db.select().from(auditLogs)).toHaveLength(0);
      } finally {
        await sql.unsafe(await Bun.file('drizzle/0095_parcel_customer_corrections.sql').text());
      }
    });
  },
);
