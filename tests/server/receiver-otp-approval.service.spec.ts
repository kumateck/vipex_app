import { afterAll, beforeAll, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { receiverOtpExceptionRoutes } from '@/server/features/parcel-receiver-otp/exception.routes';
import { errorHandler } from '@/server/middlewares/error-handler';
import { createTestAccessToken } from '../utils/auth-session';
import type { PickupOtpAuthorization } from '@/shared/shipments/receiver-otp-exception';
import { db } from '@/db/config';
import {
  auditLogs,
  branches,
  cashierSessions,
  parcels,
  payments,
  rolePermissions,
  roles,
  users,
} from '@/db/schemas';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import {
  authorizeParcelWithoutOtp,
  readParcelOtpAuthorization,
} from '@/server/features/parcel-receiver-otp/exception.service';
import { collectReceiverPaymentAndDeliverSvc } from '@/server/features/payments/service';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

const app = new Elysia()
  .use(errorHandler)
  .group('/shipments/parcels', (route) => route.use(receiverOtpExceptionRoutes));
const tokenFor = (userId: string) =>
  createTestAccessToken({
    userId,
    email: `${userId}@example.test`,
    permissions: [],
  });

let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;

beforeAll(async () => {
  fixture = await createShelfPickupFixture();
  const { companyId, actor, oldPicker, branchId, roleId } = fixture;
  const cashierRole = createId();
  await db
    .insert(roles)
    .values({ id: cashierRole, companyId, name: cashierRole, createdBy: actor });
  await db.update(users).set({ roleId: cashierRole }).where(eq(users.id, oldPicker));
  await db.insert(rolePermissions).values([
    { roleId, companyId, permission: PermissionKeys.CanAuthorizePickupWithoutOtp },
    { roleId: cashierRole, companyId, permission: PermissionKeys.CanCreateReceiverPayments },
  ]);
  await db
    .update(branches)
    .set({
      requireReceiverOtp: true,
      requirePickupOtp: true,
      usePickupQueue: true,
      requireReceiverCashierSignature: true,
    })
    .where(eq(branches.id, branchId));
  await db.insert(cashierSessions).values({
    cashierId: oldPicker,
    branchId,
    scheduledStartTime: new Date(),
    scheduledEndTime: new Date(Date.now() + 86_400_000),
    status: 'ACTIVE',
  });
});

afterAll(async () => {
  if (!fixture) return;
  await db.delete(payments).where(eq(payments.companyId, fixture.companyId));
  await db.delete(cashierSessions).where(eq(cashierSessions.cashierId, fixture.oldPicker));
  await fixture.cleanup();
});

test('admin approval unlocks only the matching cashier workflow and is consumed with payment', async () => {
  const { companyId, branchId, oldPicker, actor } = fixture;
  const parcel = await fixture.parcel();
  await db.update(parcels).set({ receivedAt: new Date() }).where(eq(parcels.id, parcel.id));
  await fixture.ticket(parcel.id);
  const scope = { companyId, branchId, parcelId: parcel.id, handoverTarget: 'main' as const };
  const cashierScope = { ...scope, workflow: 'receiver_cashier' as const };
  const request = {
    ...cashierScope,
    actorUserId: actor,
    reason: 'Verified identity in person',
    expectedReceiverId: parcel.receiverId,
    expectedCollectorId: parcel.receiverId,
  };
  const payment = {
    ...scope,
    cashierUserId: oldPicker,
    confirmedBy: oldPicker,
    requestSignature: true,
    expectedReceiverId: parcel.receiverId,
    amountCedis: 10,
    method: PaymentMethod.CASH,
  };

  const [adminToken, cashierToken] = await Promise.all([tokenFor(actor), tokenFor(oldPicker)]);
  const url = `http://localhost/shipments/parcels/${parcel.id}/otp-authorization`;
  const approveAs = (token: string) =>
    app.handle(
      new Request(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          workflow: request.workflow,
          handoverTarget: request.handoverTarget,
          reason: request.reason,
          expectedReceiverId: request.expectedReceiverId,
          expectedCollectorId: request.expectedCollectorId,
        }),
      }),
    );
  expect((await approveAs(cashierToken)).status).toBe(403);
  await expect(collectReceiverPaymentAndDeliverSvc(payment)).rejects.toThrow('OTP verification');
  const officeApproval = await authorizeParcelWithoutOtp({ ...request, workflow: 'office_pickup' });
  await expect(
    collectReceiverPaymentAndDeliverSvc({ ...payment, otpAuthorizationId: officeApproval.id }),
  ).rejects.toThrow('approval is unavailable');
  const previous = await authorizeParcelWithoutOtp(request);
  const authorized = await approveAs(adminToken);
  expect(authorized.status).toBe(200);
  const approval = (await authorized.json()) as PickupOtpAuthorization;
  const check = await app.handle(
    new Request(`${url}?workflow=receiver_cashier&handoverTarget=main`, {
      headers: { authorization: `Bearer ${cashierToken}` },
    }),
  );
  expect(check.status).toBe(200);
  expect(await check.json()).toEqual({ approval });
  expect(
    await readParcelOtpAuthorization({ ...cashierScope, handoverTarget: 'second' }),
  ).toBeNull();
  await expect(
    collectReceiverPaymentAndDeliverSvc({ ...payment, otpAuthorizationId: previous.id }),
  ).rejects.toThrow('approval is unavailable');
  await expect(
    collectReceiverPaymentAndDeliverSvc({
      ...payment,
      otpAuthorizationId: approval.id,
      requestSignature: false,
    }),
  ).rejects.toThrow('signature settings changed');
  expect(await readParcelOtpAuthorization(cashierScope)).toEqual(approval);

  const result = await collectReceiverPaymentAndDeliverSvc({
    ...payment,
    otpAuthorizationId: approval.id,
  });
  expect(result).toMatchObject({ awaitingSignature: true, status: ParcelStatus.AWAITING_PICKUP });
  const [updated] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
  expect(updated?.confirmedAt).toBeNull();
  expect(updated?.pendingReceiverHandover?.otpVerified).toBe(false);
  const [used] = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityId, parcel.id),
        eq(auditLogs.action, 'PARCEL_RECEIVER_OTP_EXCEPTION_USED'),
      ),
    );
  expect(used).toMatchObject({
    actorUserId: oldPicker,
    metadata: { approvedBy: actor, authorizationId: approval.id },
  });
  await db.update(parcels).set({ pendingReceiverHandover: null }).where(eq(parcels.id, parcel.id));
  expect(await readParcelOtpAuthorization(cashierScope)).toBeNull();
  await expect(
    collectReceiverPaymentAndDeliverSvc({ ...payment, otpAuthorizationId: approval.id }),
  ).rejects.toThrow('approval is unavailable');
});
