export const RECEIVER_OTP_EXPIRY_MINUTES = 10;

export type ReceiverOtpSession = {
  sentAt: string;
  expiresAt: string;
  channel: 'sms' | 'whatsapp';
  phoneSlot: 'primary' | 'secondary';
  verificationToken: string | null;
};

export function getReceiverOtpRemainingSeconds(expiresAt: string | null, now: number) {
  const expiry = expiresAt ? Date.parse(expiresAt) : NaN;
  return expiry > now ? Math.ceil((expiry - now) / 1000) : 0;
}
