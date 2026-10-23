import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import * as audit from '../../audit/logger';
import * as repository from '../repository';
import * as sms from './sms-events.service';
import * as dispatch from './dispatch-message.service';
import { sendParcelStatusNotificationSvc } from './parcel-notifications.service';

const parcel = {
  parcelId: 'parcel',
  bookingCode: 'BOOK',
  trackingCode: 'TRACK',
  branch: 'Circle',
  branchPhone: '0300000000',
  location: null,
  locationPhone: null,
  primary: {
    id: 'main',
    name: 'Receiver',
    phone: '0240000000',
    phone2: null,
    email: 'receiver@example.test',
    type: 'receiver',
  },
  secondary: {
    id: 'second',
    name: 'Second',
    phone: '0200000000',
    email: 'second@example.test',
    type: 'second_receiver',
  },
};
const input = {
  companyId: 'company',
  actorUserId: 'agent',
  parcelId: 'parcel',
  outcome: 'pickup',
  sendSms: true,
};
const restorations: Array<() => void> = [];
beforeEach(() => {
  const getParcel = spyOn(repository, 'getParcelRecipientsRepo').mockResolvedValue(parcel);
  const log = spyOn(audit, 'recordAuditLog').mockResolvedValue(undefined);
  restorations.push(
    () => getParcel.mockRestore(),
    () => log.mockRestore(),
  );
});
afterEach(() => {
  for (const restore of restorations.splice(0).reverse()) restore();
});

describe('call outcome notification failure details', () => {
  test('preserves mNotify failure details in the response without retrying', async () => {
    const send = spyOn(sms, 'dispatchSmsEventSvc').mockResolvedValue({
      status: 'failed',
      errorMessage: 'mNotify service error (HTTP 500). Delivery acceptance could not be confirmed.',
    });
    restorations.push(() => send.mockRestore());
    expect(await sendParcelStatusNotificationSvc(input)).toEqual({
      parcelId: 'parcel',
      trackingCode: 'TRACK',
      sentCount: 0,
      failedCount: 1,
      failures: [
        {
          channel: 'sms',
          recipientType: 'receiver',
          message: 'mNotify service error (HTTP 500). Delivery acceptance could not be confirmed.',
        },
      ],
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCode: 'parcel_status_call_pickup',
        phone: parcel.primary.phone,
        variables: expect.objectContaining({
          branchPhone: parcel.branchPhone,
          locationPhone: parcel.locationPhone,
        }),
      }),
    );
  });

  test('counts success separately and identifies a failed second receiver', async () => {
    const send = spyOn(sms, 'dispatchSmsEventSvc')
      .mockResolvedValueOnce({ status: 'sent' })
      .mockResolvedValueOnce({ status: 'failed', errorMessage: 'Recipient rejected' });
    restorations.push(() => send.mockRestore());
    expect(
      await sendParcelStatusNotificationSvc({ ...input, includeSecondReceiver: true }),
    ).toMatchObject({
      sentCount: 1,
      failedCount: 1,
      failures: [
        { channel: 'sms', recipientType: 'second_receiver', message: 'Recipient rejected' },
      ],
    });
    expect(send).toHaveBeenCalledTimes(2);
  });

  test('returns no failures on successful sends', async () => {
    const send = spyOn(sms, 'dispatchSmsEventSvc').mockResolvedValue({ status: 'sent' });
    restorations.push(() => send.mockRestore());
    expect(await sendParcelStatusNotificationSvc(input)).toMatchObject({
      sentCount: 1,
      failedCount: 0,
      failures: [],
    });
  });

  test('returns email failure and dispatch-creation failure details', async () => {
    const provider = spyOn(repository, 'getDefaultProviderByChannelRepo').mockResolvedValue(null);
    const create = spyOn(repository, 'createNotificationDispatchRepo')
      .mockResolvedValueOnce({ id: 'dispatch' })
      .mockResolvedValueOnce(null);
    const send = spyOn(dispatch, 'dispatchSingleMessage').mockResolvedValue({
      status: 'failed',
      errorMessage: 'No active default provider configured for email',
    });
    restorations.push(
      () => provider.mockRestore(),
      () => create.mockRestore(),
      () => send.mockRestore(),
    );
    expect(
      await sendParcelStatusNotificationSvc({
        ...input,
        sendSms: false,
        sendEmail: true,
        includeSecondReceiver: true,
      }),
    ).toMatchObject({
      sentCount: 0,
      failedCount: 2,
      failures: [
        {
          channel: 'email',
          recipientType: 'receiver',
          message: 'No active default provider configured for email',
        },
        {
          channel: 'email',
          recipientType: 'second_receiver',
          message: 'Failed to create notification dispatch record',
        },
      ],
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  test('redacts API query credentials and supplies a fallback for missing diagnostics', async () => {
    const send = spyOn(sms, 'dispatchSmsEventSvc')
      .mockResolvedValueOnce({
        status: 'failed',
        errorMessage: 'https://provider.test?key=secret&access_token=private',
      })
      .mockResolvedValueOnce({ status: 'failed' });
    restorations.push(() => send.mockRestore());
    const result = await sendParcelStatusNotificationSvc({ ...input, includeSecondReceiver: true });
    expect(result.failures.map((failure) => failure.message)).toEqual([
      'https://provider.test?key=[REDACTED]&access_token=[REDACTED]',
      'The notification provider did not accept the message',
    ]);
  });
});
