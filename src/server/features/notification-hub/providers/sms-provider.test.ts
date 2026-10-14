import { describe, expect, test } from 'bun:test';
import { sendSmsWithProvider } from './sms-provider';

const provider = {
  id: 'provider',
  name: 'Simulation',
  providerKey: 'log_only',
  configJson: null,
  channel: 'sms',
  isActive: true,
  isDefault: true,
};
describe('simulation provider OTP behavior', () => {
  test('does not claim pickup OTPs were delivered by a log-only provider', async () => {
    expect(
      await sendSmsWithProvider(provider, '0240000000', 'Your code is 123456', 'otp'),
    ).toMatchObject({ status: 'failed' });
  });
  test('ordinary simulation messages remain supported', async () => {
    expect(await sendSmsWithProvider(provider, '0240000000', 'Parcel ready')).toMatchObject({
      status: 'sent',
    });
  });
});
