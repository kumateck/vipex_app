import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from 'bun:test';
import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db, closeSql } from '@/db/config';
import { customers, parcelReceiverOtps, parcels, refreshTokens } from '@/db/schemas';
import { PermissionKeys } from '@/shared/permissions/constants';
import { signAccessToken } from '@/server/utils/jwt';
import { HttpError } from '@/server/utils/http-error';
import { receiverOtpSessionRoutes } from '@/server/features/parcel-receiver-otp';
import { getReceiverOtpSession } from '@/server/features/parcel-receiver-otp';
import {
  requestReceiverOtpSvc,
  verifyReceiverOtpSvc,
} from '@/server/features/parcel-receiver-otp/service';
import * as notificationRepository from '@/server/features/notification-hub/repository';
import * as notificationService from '@/server/features/notification-hub/service';
import * as parcelService from '@/server/features/shipments/parcels.service';
import { createCustomerCorrectionFixture } from '../utils/customer-correction-fixture';

const scope = {
  companyId: 'company',
  branchId: 'accra',
  actorUserId: 'actor',
  parcelId: 'parcel-a',
  targetReceiver: 'main' as const,
};

describe.skipIf(process.env.RECEIVER_OTP_SESSION_TEST !== '1')(
  'resumable receiver OTP sessions',
  () => {
    let fixture: Awaited<ReturnType<typeof createCustomerCorrectionFixture>>;
    beforeAll(async () => {
      fixture = await createCustomerCorrectionFixture();
    });
    beforeEach(async () => {
      await fixture.reset();
    });
    afterEach(() => mock.restore());
    afterAll(async () => {
      if (fixture) await fixture.cleanup();
      await closeSql();
    });

    function arrangeSend() {
      spyOn(parcelService, 'getParcelSvc').mockResolvedValue({ status: 5 } as never);
      spyOn(notificationRepository, 'getParcelRecipientsRepo').mockResolvedValue({
        primary: { phone: '0540345985', phone2: '0245555555', name: 'Receiver' },
        branch: 'Accra',
        location: 'Circle',
      } as never);
      return spyOn(notificationService, 'dispatchSmsEventSvc').mockResolvedValue({
        status: 'sent',
      } as never);
    }
    const send = () => requestReceiverOtpSvc({ ...scope, requestedBy: scope.actorUserId });

    test('session endpoint enforces authentication and pickup permissions and disables response caching', async () => {
      const app = new Elysia()
        .onError(({ error, set }) => {
          if (error instanceof HttpError) set.status = error.status;
          return { message: error instanceof Error ? error.message : 'Request failed' };
        })
        .use(receiverOtpSessionRoutes);
      const url = 'http://localhost/receiver-otp/session?parcelId=parcel-a&targetReceiver=main';
      expect((await app.handle(new Request(url))).status).toBe(401);
      const [session] = await db
        .insert(refreshTokens)
        .values({
          userId: 'actor',
          tokenHash: 'test-session',
          expiresAt: new Date(Date.now() + 600000),
          permissionsSnapshot: [PermissionKeys.CanCompleteOfficePickup],
        })
        .returning();
      const token = await signAccessToken({
        sub: 'actor',
        sid: session!.id,
        email: 'actor@example.test',
        companyId: 'company',
        branchId: 'accra',
      });
      const request = () =>
        app.handle(new Request(url, { headers: { authorization: `Bearer ${token}` } }));
      expect(await (await request()).json()).toBeNull();
      await fixture.otp();
      const response = await request();
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store, private');
      expect((await response.json()).verificationToken).toBeNull();
      await db
        .update(refreshTokens)
        .set({ permissionsSnapshot: [] })
        .where(eq(refreshTokens.id, session!.id));
      expect(
        (await app.handle(new Request(url, { headers: { authorization: `Bearer ${token}` } })))
          .status,
      ).toBe(403);
    });

    test('new codes and their message expire in ten minutes; reopening does not extend expiry or resend', async () => {
      const dispatch = arrangeSend();
      const before = Date.now();
      const sent = await send();
      const expiry = Date.parse(sent.expiresAt);
      expect(expiry).toBeGreaterThanOrEqual(before + 600000);
      expect(expiry).toBeLessThanOrEqual(Date.now() + 600000);
      expect(dispatch.mock.calls[0]![0].variables?.expiresInMinutes).toBe(10);
      const first = await getReceiverOtpSession(scope);
      expect(await getReceiverOtpSession({ ...scope, parcelId: 'parcel-b' })).toBeNull();
      const reopened = await getReceiverOtpSession(scope);
      expect(reopened).toEqual(first);
      expect(reopened?.expiresAt).toBe(sent.expiresAt);
      expect(reopened?.verificationToken).toBeNull();
      expect(reopened).not.toHaveProperty('otpHash');
      expect(reopened).not.toHaveProperty('otp');
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(await db.select().from(parcelReceiverOtps)).toHaveLength(1);
    });
    test('reopened parcel can verify the original code and restore its own unconsumed proof', async () => {
      const dispatch = arrangeSend();
      await send();
      await getReceiverOtpSession(scope);
      const otp = String(dispatch.mock.calls[0]![0].variables?.otp);
      const verified = await verifyReceiverOtpSvc({ ...scope, otp });
      const reopened = await getReceiverOtpSession(scope);
      expect(reopened?.verificationToken).toBe(verified.verificationToken);
      expect(reopened?.expiresAt).toBe(verified.expiresAt);
      expect(await getReceiverOtpSession({ ...scope, actorUserId: 'another-officer' })).toBeNull();
    });
    test('secondary telephone and WhatsApp choice are restored from the issued session', async () => {
      await db
        .update(customers)
        .set({ telephone2: '0245555555' })
        .where(eq(customers.id, 'receiver'));
      const row = await fixture.otp('main', '0245555555');
      await db
        .update(parcelReceiverOtps)
        .set({ channel: 'whatsapp' })
        .where(eq(parcelReceiverOtps.id, row.id));
      expect(await getReceiverOtpSession(scope)).toMatchObject({
        channel: 'whatsapp',
        phoneSlot: 'secondary',
        verificationToken: null,
      });
    });
    test('another company or destination branch cannot retrieve an OTP session', async () => {
      await fixture.otp();
      await expect(getReceiverOtpSession({ ...scope, companyId: 'other' })).rejects.toMatchObject({
        status: 404,
      });
      await expect(getReceiverOtpSession({ ...scope, branchId: 'kumasi' })).rejects.toMatchObject({
        status: 404,
      });
    });
    test('expired, delivered and contact-corrected sessions cannot be restored', async () => {
      const row = await fixture.otp();
      await db
        .update(parcelReceiverOtps)
        .set({
          expiresAt: new Date(Date.now() - 1),
          verificationToken: null,
          verificationTokenExpiresAt: null,
        })
        .where(eq(parcelReceiverOtps.id, row.id));
      expect(await getReceiverOtpSession(scope)).toBeNull();
      await fixture.otp();
      await db
        .update(customers)
        .set({ telephone: '0246666666' })
        .where(eq(customers.id, 'receiver'));
      expect(await getReceiverOtpSession(scope)).toBeNull();
      await db
        .update(customers)
        .set({ telephone: '0540345985' })
        .where(eq(customers.id, 'receiver'));
      await db.update(parcels).set({ status: 6 }).where(eq(parcels.id, 'parcel-a'));
      expect(await getReceiverOtpSession(scope)).toBeNull();
    });
    test('consumed and expired verification proofs cannot be restored', async () => {
      const row = await fixture.otp();
      await db
        .update(parcelReceiverOtps)
        .set({ verifiedAt: new Date(), verificationTokenExpiresAt: new Date(Date.now() - 1) })
        .where(eq(parcelReceiverOtps.id, row.id));
      expect(await getReceiverOtpSession(scope)).toBeNull();
      await db
        .update(parcelReceiverOtps)
        .set({ verificationToken: null, verificationTokenExpiresAt: new Date(Date.now() + 600000) })
        .where(eq(parcelReceiverOtps.id, row.id));
      expect(await getReceiverOtpSession(scope)).toBeNull();
    });
  },
);
