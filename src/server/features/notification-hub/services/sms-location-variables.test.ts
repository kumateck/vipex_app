import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import * as repository from '../repository';
import * as providers from '../providers';
import { dispatchSmsEventSvc } from './sms-events.service';

const restorations: Array<() => void> = [];
afterEach(() => {
  for (const restore of restorations.splice(0).reverse()) restore();
});

describe('SMS event location variables', () => {
  test.each([
    {
      location: 'Adum desk',
      locationPhone: '0300000001',
      expected: 'Adum desk / Adum desk / 0300000001',
    },
    { location: null, locationPhone: null, expected: ' /  / ' },
  ])(
    'renders current location context before recording and sending',
    async ({ location, locationPhone, expected }) => {
      const provider = spyOn(repository, 'getDefaultProviderByChannelRepo').mockResolvedValue({
        id: 'provider',
        name: 'Synthetic',
        channel: 'sms',
        providerKey: 'log_only',
        configJson: null,
        isActive: true,
        isDefault: true,
      });
      const template = spyOn(repository, 'getNotificationTemplateByCodeRepo').mockResolvedValue({
        id: 'template',
        channel: 'sms',
        code: 'parcel_status_call_pickup',
        subject: null,
        body: '{{locationName}} / {{location}} / {{locationPhone}}',
      });
      const create = spyOn(repository, 'createNotificationDispatchRepo').mockResolvedValue({
        id: 'dispatch',
      });
      const update = spyOn(repository, 'updateNotificationDispatchResultRepo').mockResolvedValue({
        id: 'dispatch',
      });
      const send = spyOn(providers, 'sendSmsWithProvider').mockResolvedValue({ status: 'sent' });
      restorations.push(
        () => provider.mockRestore(),
        () => template.mockRestore(),
        () => create.mockRestore(),
        () => update.mockRestore(),
        () => send.mockRestore(),
      );
      expect(
        await dispatchSmsEventSvc({
          companyId: 'company',
          eventCode: 'parcel_status_call_pickup',
          phone: '0240000000',
          recipientType: 'receiver',
          variables: { location, locationPhone },
        }),
      ).toMatchObject({ status: 'sent' });
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ body: expected }));
      expect(send).toHaveBeenCalledWith(expect.any(Object), '0240000000', expected, undefined);
    },
  );
});
