import { describe, expect, test } from 'bun:test';
import { buildMnotifySmsPayload } from './sms-provider-payloads';

describe('mNotify SMS payload', () => {
  test('marks OTP messages with the provider OTP type', () => {
    expect(
      buildMnotifySmsPayload({
        recipient: '0249667429',
        sender: 'Vipex',
        message: 'Your code is 123456',
        smsType: 'otp',
      }),
    ).toMatchObject({ sms_type: 'otp' });
  });

  test('does not classify ordinary transactional messages as OTP', () => {
    expect(
      buildMnotifySmsPayload({
        recipient: '0249667429',
        sender: 'Vipex',
        message: 'Your parcel is ready',
      }),
    ).not.toHaveProperty('sms_type');
  });
});
