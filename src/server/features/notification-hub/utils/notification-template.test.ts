import { describe, expect, test } from 'bun:test';
import { renderTemplate } from './notification-template';
import { getSmsEventBodyError } from './sms-event-body';
import { resolveMnotifyApiRoot } from './mnotify-api-url';

describe('OTP template and API URL configuration', () => {
  test('renders OTP tokens including whitespace while preserving ordinary template behavior', () => {
    expect(
      renderTemplate('{{ receiverName }}, code {{ otp }} expires {{minutes}} {{missing}}', {
        receiverName: 'Customer',
        otp: '123456',
        minutes: 5,
      }),
    ).toBe('Customer, code 123456 expires 5 {{missing}}');
    expect(renderTemplate('{{branch}} {{location}}', { branch: 'Accra', location: null })).toBe(
      'Accra ',
    );
  });
  test('OTP templates must include a code, ordinary messages do not', () => {
    expect(getSmsEventBodyError('otp', 'Your parcel is ready')).toBe(
      'Pickup OTP SMS template must include {{otp}}',
    );
    expect(getSmsEventBodyError('otp', 'Code {{ otp }}')).toBeNull();
    expect(getSmsEventBodyError(undefined, 'Your parcel is ready')).toBeNull();
  });
  test('normalizes optional, root and full-endpoint URLs for both sending and balance checks', () => {
    for (const value of [
      '',
      'https://api.mnotify.com',
      'https://api.mnotify.com/api/',
      'https://api.mnotify.com/api/sms/quick?key=old-key',
    ]) {
      expect(resolveMnotifyApiRoot(value)).toBe('https://api.mnotify.com/api');
    }
  });
});
