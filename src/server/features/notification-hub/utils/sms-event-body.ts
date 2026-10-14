import type { SmsType } from '../sms-provider-payloads';

export function getSmsEventBodyError(smsType: SmsType | undefined, template: string) {
  if (smsType === 'otp' && !/{{\s*otp\s*}}/.test(template))
    return 'Pickup OTP SMS template must include {{otp}}';
  return null;
}
