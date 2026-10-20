import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { Elysia } from 'elysia';
import * as jwt from '@/server/utils/jwt';
import * as authRepository from '@/server/features/auth/repository';
import * as moduleRepository from '@/server/features/company-modules/repository';
import * as service from './services/parcel-call-resend.service';
import { parcelCallResendRoutes } from './parcel-call-resend.routes';
import { PermissionKeys } from '@/shared/permissions/constants';

const now = new Date();
const session = {
  id: 'session',
  userId: 'agent',
  deviceId: null,
  tokenHash: 'hash',
  expiresAt: new Date(Date.now() + 60_000),
  createdAt: now,
  revokedAt: null,
  replacedByHash: null,
  userAgent: null,
  ip: null,
  permissionsSnapshot: [PermissionKeys.CanReadCallCenterParcelStatus],
};
const moduleState = {
  id: 'module',
  companyId: 'company',
  moduleCode: 'notification_hub',
  isEnabled: true,
  enabledAt: now,
  disabledAt: null,
  configuredBy: null,
  settings: null,
  createdAt: now,
  updatedAt: now,
};
const result = {
  parcelId: 'parcel',
  trackingCode: 'TRACK',
  sentCount: 1,
  failedCount: 0,
  failures: [],
};
const restorations: Array<() => void> = [];
function dependencies() {
  const verify = spyOn(jwt, 'verifyAccessToken').mockResolvedValue({
    sub: 'agent',
    sid: 'session',
    email: 'agent@example.test',
    companyId: 'company',
    branchId: 'branch',
    iat: 0,
    exp: 0,
  });
  const getSession = spyOn(authRepository, 'findRefreshTokenByIdRepo').mockResolvedValue(session);
  const getModule = spyOn(moduleRepository, 'findCompanyModuleRepo').mockResolvedValue(moduleState);
  const resend = spyOn(service, 'resendParcelCallNotificationSvc').mockResolvedValue(result);
  restorations.push(
    () => verify.mockRestore(),
    () => getSession.mockRestore(),
    () => getModule.mockRestore(),
    () => resend.mockRestore(),
  );
  return { getSession, getModule, resend };
}
let mocks: ReturnType<typeof dependencies>;
beforeEach(() => {
  mocks = dependencies();
});
afterEach(() => {
  for (const restore of restorations.splice(0).reverse()) restore();
});

const app = new Elysia()
  .onError(({ error, set }) => {
    if ('status' in error && typeof error.status === 'number') set.status = error.status;
    return { message: 'message' in error ? error.message : 'Request failed' };
  })
  .group('/v1/notification-hub', (router) => router.use(parcelCallResendRoutes));
const body = { parcelId: 'parcel', expectedOutcome: 'pickup', sendSms: true, sendEmail: false };
function request(payload: unknown = body, authenticated = true) {
  return app.handle(
    new Request('http://localhost/v1/notification-hub/events/parcel-status-call/resend', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authenticated ? { authorization: 'Bearer test' } : {}),
      },
      body: JSON.stringify(payload),
    }),
  );
}

describe('saved call outcome resend endpoint', () => {
  test('requires authentication before sending', async () => {
    expect((await request(body, false)).status).toBe(401);
    expect(mocks.resend).not.toHaveBeenCalled();
  });
  test('requires a call-center notification permission', async () => {
    mocks.getSession.mockResolvedValue({ ...session, permissionsSnapshot: [] });
    expect((await request()).status).toBe(403);
    expect(mocks.resend).not.toHaveBeenCalled();
  });
  test('requires the notification hub module', async () => {
    mocks.getModule.mockResolvedValue({ ...moduleState, isEnabled: false });
    expect((await request()).status).toBe(403);
    expect(mocks.resend).not.toHaveBeenCalled();
  });
  test.each([
    PermissionKeys.CanReadCallCenterParcelStatus,
    PermissionKeys.CanSendCallCenterNotifications,
  ])('accepts %s and derives scope from the authenticated session', async (permission) => {
    mocks.getSession.mockResolvedValue({ ...session, permissionsSnapshot: [permission] });
    const response = await request();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(mocks.resend).toHaveBeenCalledWith({
      ...body,
      companyId: 'company',
      branchId: 'branch',
      actorUserId: 'agent',
      includeSecondReceiver: false,
    });
    expect(mocks.getModule).toHaveBeenCalledWith('company', 'notification_hub');
  });
  test('rejects an invalid outcome before reaching the send service', async () => {
    expect((await request({ ...body, expectedOutcome: 'delivered' })).status).toBe(422);
    expect(mocks.resend).not.toHaveBeenCalled();
  });
});
