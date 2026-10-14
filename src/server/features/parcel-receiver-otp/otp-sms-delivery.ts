import { ServiceUnavailable } from '@/server/utils/http-error';

type SmsResult = { status: 'sent' | 'failed'; errorMessage?: string | null };

export async function requireOtpSmsDelivery(input: {
  send: () => Promise<SmsResult>;
  expireFailedOtp: () => Promise<void>;
}) {
  let result: SmsResult;
  try {
    result = await input.send();
  } catch {
    await input.expireFailedOtp();
    throw ServiceUnavailable(
      'Pickup OTP could not be sent. Please retry or check SMS Configuration.',
    );
  }
  if (result.status === 'sent') return;
  await input.expireFailedOtp();
  const detail = (result.errorMessage ?? 'SMS provider did not accept the message')
    .replace(/([?&]key=)[^\s&"']+/gi, '$1[REDACTED]')
    .slice(0, 500);
  throw ServiceUnavailable(`Pickup OTP could not be sent: ${detail}`);
}
