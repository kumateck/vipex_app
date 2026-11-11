export const RECEIVER_OTP_EXPIRY_MINUTES = 10;

export type ReceiverOtpSession = {
  sentAt: string;
  expiresAt: string;
  channel: 'sms' | 'whatsapp';
  phoneSlot: 'primary' | 'secondary';
  verificationToken: string | null;
};
