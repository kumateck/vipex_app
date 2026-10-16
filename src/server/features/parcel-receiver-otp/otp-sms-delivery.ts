import { ServiceUnavailable } from '@/server/utils/http-error';

type SmsResult = { status: 'sent' | 'failed'; errorMessage?: string | null };
export type OtpDeliveryChannel = 'sms' | 'whatsapp';

const CHANNEL_LABEL: Record<OtpDeliveryChannel, { settings: string; fallback: string }> = {
  sms: { settings: 'SMS Configuration', fallback: 'SMS provider did not accept the message' },
  whatsapp: {
    settings: 'WhatsApp Settings',
    fallback: 'WhatsApp provider did not accept the message',
  },
};

/**
 * Only reports success once the provider accepted the message; any failure
 * expires the just-created OTP so the cashier never waits on a code that
 * was never delivered.
 */
export async function requireOtpSmsDelivery(input: {
  send: () => Promise<SmsResult>;
  expireFailedOtp: () => Promise<void>;
  channel?: OtpDeliveryChannel;
}) {
  const label = CHANNEL_LABEL[input.channel ?? 'sms'];
  let result: SmsResult;
  try {
    result = await input.send();
  } catch {
    await input.expireFailedOtp();
    throw ServiceUnavailable(
      `Pickup OTP could not be sent. Please retry or check ${label.settings}.`,
    );
  }
  if (result.status === 'sent') return;
  await input.expireFailedOtp();
  const detail = (result.errorMessage ?? label.fallback)
    .replace(/([?&]key=)[^\s&"']+/gi, '$1[REDACTED]')
    .slice(0, 500);
  throw ServiceUnavailable(`Pickup OTP could not be sent: ${detail}`);
}
