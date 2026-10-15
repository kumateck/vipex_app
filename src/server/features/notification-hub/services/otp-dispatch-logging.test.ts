import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import * as repository from '../repository';
import * as providers from '../providers';
import { dispatchSingleMessage } from './dispatch-message.service';
import { dispatchSmsEventSvc } from './sms-events.service';

const provider = {
  id: 'provider',
  name: 'Simulation',
  providerKey: 'log_only',
  configJson: null,
  channel: 'sms',
  isActive: true,
  isDefault: true,
};
const input = {
  companyId: 'company',
  provider,
  dispatchId: 'dispatch',
  channel: 'sms',
  recipientAddress: '0240000000',
  subject: null,
  body: 'Code 123456',
  smsType: 'otp' as const,
};
const restorations: Array<() => void> = [];
afterEach(() => {
  for (const restore of restorations.splice(0).reverse()) restore();
});

function mockLogUpdate() {
  const update = spyOn(repository, 'updateNotificationDispatchResultRepo').mockResolvedValue({
    id: 'dispatch',
  });
  restorations.push(() => update.mockRestore());
  return update;
}

describe('pickup OTP dispatch failure logs', () => {
  test('records a missing provider failure instead of leaving a pending dispatch', async () => {
    const update = mockLogUpdate();
    expect(await dispatchSingleMessage({ ...input, provider: null })).toMatchObject({
      status: 'failed',
      errorMessage: 'No active default provider configured for sms',
    });
    expect(update).toHaveBeenCalledWith(
      'dispatch',
      'company',
      expect.objectContaining({
        status: 'failed',
        attemptCount: 1,
        providerId: null,
      }),
    );
  });

  test('logs log-only OTP rejection with the configured provider', async () => {
    const update = mockLogUpdate();
    await dispatchSingleMessage(input);
    expect(update).toHaveBeenCalledWith(
      'dispatch',
      'company',
      expect.objectContaining({
        status: 'failed',
        providerId: 'provider',
        providerKey: 'log_only',
        errorMessage: expect.stringContaining('cannot deliver pickup OTPs'),
      }),
    );
  });

  test('logs unexpected transport exceptions', async () => {
    const update = mockLogUpdate();
    const send = spyOn(providers, 'sendSmsWithProvider').mockRejectedValue(
      new Error('Transport broke'),
    );
    restorations.push(() => send.mockRestore());
    expect(await dispatchSingleMessage(input)).toMatchObject({
      status: 'failed',
      errorMessage: 'Transport broke',
    });
    expect(update).toHaveBeenCalledWith(
      'dispatch',
      'company',
      expect.objectContaining({
        status: 'failed',
        errorMessage: 'Transport broke',
      }),
    );
  });

  test('logs an existing template without the OTP token and makes no billable send', async () => {
    const update = mockLogUpdate();
    const getProvider = spyOn(repository, 'getDefaultProviderByChannelRepo').mockResolvedValue(
      provider,
    );
    const getTemplate = spyOn(repository, 'getNotificationTemplateByCodeRepo').mockResolvedValue({
      id: 'template',
      channel: 'sms',
      code: 'receiver_pickup_otp',
      subject: null,
      body: 'Your parcel is ready',
    });
    const create = spyOn(repository, 'createNotificationDispatchRepo').mockResolvedValue({
      id: 'dispatch',
    });
    const send = spyOn(providers, 'sendSmsWithProvider');
    restorations.push(
      () => getProvider.mockRestore(),
      () => getTemplate.mockRestore(),
      () => create.mockRestore(),
      () => send.mockRestore(),
    );
    expect(
      await dispatchSmsEventSvc({
        companyId: 'company',
        eventCode: 'receiver_pickup_otp',
        phone: '0240000000',
        recipientType: 'customer',
        variables: { otp: '123456' },
      }),
    ).toMatchObject({ status: 'failed', errorMessage: expect.stringContaining('{{otp}}') });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadataJson: { eventCode: 'receiver_pickup_otp' },
        status: 'pending',
      }),
    );
    expect(update).toHaveBeenCalledWith(
      'dispatch',
      'company',
      expect.objectContaining({
        status: 'failed',
        attemptCount: 0,
      }),
    );
    expect(send).not.toHaveBeenCalled();
  });
});
