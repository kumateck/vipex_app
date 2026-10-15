import { describe, expect, test } from 'bun:test';
import { requireOtpSmsDelivery } from './otp-sms-delivery';

describe('pickup OTP SMS delivery acknowledgement', () => {
  test('reports success only after the provider accepts the message', async () => {
    let expired = false;
    await requireOtpSmsDelivery({
      send: async () => ({ status: 'sent' }),
      expireFailedOtp: async () => {
        expired = true;
      },
    });
    expect(expired).toBe(false);
  });
  test.each([
    'No active default provider configured for sms',
    'mNotify rejected the message (code 1000)',
    'mNotify provider is missing configuration (apiKey/senderId/apiUrl)',
  ])(
    'surfaces provider failure and expires only the newly created OTP: %s',
    async (errorMessage) => {
      const activeIds = new Set(['previous-successful-otp', 'failed-new-otp']);
      const input = {
        send: async () => ({ status: 'failed' as const, errorMessage }),
        expireFailedOtp: async () => {
          activeIds.delete('failed-new-otp');
        },
      };
      await expect(requireOtpSmsDelivery(input)).rejects.toMatchObject({
        status: 503,
        message: `Pickup OTP could not be sent: ${errorMessage}`,
      });
      expect([...activeIds]).toEqual(['previous-successful-otp']);
    },
  );
  test('unexpected dispatch errors also invalidate the new code and never claim it was sent', async () => {
    let expired = false;
    await expect(
      requireOtpSmsDelivery({
        send: async () => {
          throw new Error('network failure');
        },
        expireFailedOtp: async () => {
          expired = true;
        },
      }),
    ).rejects.toMatchObject({ status: 503 });
    expect(expired).toBe(true);
  });
  test('redacts API keys in provider URL errors', async () => {
    await expect(
      requireOtpSmsDelivery({
        send: async () => ({
          status: 'failed',
          errorMessage: 'https://provider.test/sms?key=private-value',
        }),
        expireFailedOtp: async () => {},
      }),
    ).rejects.toMatchObject({
      message: 'Pickup OTP could not be sent: https://provider.test/sms?key=[REDACTED]',
    });
  });
});
