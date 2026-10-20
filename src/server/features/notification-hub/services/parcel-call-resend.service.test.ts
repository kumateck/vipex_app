import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import * as repository from '../parcel-call-resend.repository';
import * as notifications from './parcel-notifications.service';
import { resendParcelCallNotificationSvc } from './parcel-call-resend.service';

const parcel = {
  companyId: 'company',
  destinationId: 'branch',
  callCenterAssignedToUserId: 'agent',
  callCenterCalledAt: new Date('2026-10-20T07:00:00Z'),
  status: ParcelStatus.AWAITING_PICKUP,
  isDeleted: false,
};
const input = {
  companyId: 'company',
  branchId: 'branch',
  actorUserId: 'agent',
  parcelId: 'parcel',
  expectedOutcome: 'pickup' as const,
  sendSms: true,
  sendEmail: false,
  includeSecondReceiver: true,
};
const result = {
  parcelId: 'parcel',
  trackingCode: 'TRACK',
  sentCount: 1,
  failedCount: 0,
  failures: [],
};
let getTarget = spyOn(repository, 'getParcelCallResendTargetRepo');
let send = spyOn(notifications, 'sendParcelStatusNotificationSvc');
beforeEach(() => {
  getTarget = spyOn(repository, 'getParcelCallResendTargetRepo').mockResolvedValue({ ...parcel });
  send = spyOn(notifications, 'sendParcelStatusNotificationSvc').mockResolvedValue(result);
});
afterEach(() => {
  getTarget.mockRestore();
  send.mockRestore();
});

describe('resend saved call outcome notifications', () => {
  test('resends once using the stored outcome and selected channels without changing the saved parcel', async () => {
    const snapshot = { ...parcel };
    getTarget.mockResolvedValue(Object.freeze(snapshot));
    expect(await resendParcelCallNotificationSvc(input)).toEqual(result);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({
      companyId: 'company',
      actorUserId: 'agent',
      parcelId: 'parcel',
      outcome: 'pickup',
      sendSms: true,
      sendEmail: false,
      includeSecondReceiver: true,
      isResend: true,
    });
    expect(snapshot).toEqual(parcel);
  });

  test.each([
    { status: ParcelStatus.CUSTOMER_CONTACTED, expectedOutcome: 'follow_up' as const },
    { status: ParcelStatus.HOME_DELIVERY_REQUESTED, expectedOutcome: 'delivery' as const },
  ])('resends $expectedOutcome using email only', async ({ status, expectedOutcome }) => {
    getTarget.mockResolvedValue({ ...parcel, status });
    await resendParcelCallNotificationSvc({
      ...input,
      expectedOutcome,
      sendSms: false,
      sendEmail: true,
      includeSecondReceiver: false,
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: expectedOutcome,
        sendSms: false,
        sendEmail: true,
        includeSecondReceiver: false,
      }),
    );
  });

  test.each([
    { companyId: 'other' },
    { destinationId: 'other' },
    { callCenterAssignedToUserId: 'other' },
    { callCenterAssignedToUserId: null },
    { isDeleted: true },
  ])('rejects an out-of-scope target before sending: %j', async (patch) => {
    getTarget.mockResolvedValue({ ...parcel, ...patch });
    await expect(resendParcelCallNotificationSvc(input)).rejects.toMatchObject({ status: 404 });
    expect(send).not.toHaveBeenCalled();
  });

  test('rejects a missing parcel', async () => {
    getTarget.mockResolvedValue(null);
    await expect(resendParcelCallNotificationSvc(input)).rejects.toMatchObject({ status: 404 });
    expect(send).not.toHaveBeenCalled();
  });

  test.each([
    { callCenterCalledAt: null },
    { status: ParcelStatus.CUSTOMER_CONTACTED },
    { status: ParcelStatus.DISPATCHED },
    { status: ParcelStatus.DELIVERED_BY_OFFICE },
  ])('rejects unsaved, changed, or progressed outcomes: %j', async (patch) => {
    getTarget.mockResolvedValue({ ...parcel, ...patch });
    await expect(resendParcelCallNotificationSvc(input)).rejects.toMatchObject({ status: 409 });
    expect(send).not.toHaveBeenCalled();
  });

  test('requires at least one channel and authenticated company/branch context', async () => {
    for (const patch of [
      { sendSms: false, sendEmail: false },
      { branchId: '' },
      { companyId: '' },
    ]) {
      await expect(resendParcelCallNotificationSvc({ ...input, ...patch })).rejects.toMatchObject({
        status: 400,
      });
    }
    expect(getTarget).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  test('returns a provider failure without automatically retrying', async () => {
    const failure = {
      ...result,
      sentCount: 0,
      failedCount: 1,
      failures: [
        {
          channel: 'sms' as const,
          recipientType: 'receiver' as const,
          message: 'mNotify service error (HTTP 500)',
        },
      ],
    };
    send.mockResolvedValue(failure);
    expect(await resendParcelCallNotificationSvc(input)).toEqual(failure);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
