import type { OtpChannel } from '../types';
export { getReceiverOtpRemainingSeconds as getRemainingSeconds } from '@/shared/shipments/receiver-otp-session';

export const OTP_LENGTH = 6;

/** Keeps only digits and caps the code at six, as the web OTP input does. */
export function sanitizeOtpInput(value: string) {
  return value.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export function isCompleteOtp(code: string) {
  return code.length === OTP_LENGTH;
}

/** WhatsApp is only sent when the company has it available; otherwise SMS. */
export function resolveOtpChannel(selected: OtpChannel, isWhatsAppAvailable: boolean): OtpChannel {
  return isWhatsAppAvailable && selected === 'whatsapp' ? 'whatsapp' : 'sms';
}

export function formatCountdown(remainingSeconds: number) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function getOtpSendLabel(input: { pending: boolean; sent: boolean }) {
  if (input.pending) return 'Sending…';
  return input.sent ? 'Resend OTP' : 'Send Collection OTP';
}

/** Toast copy after a send, with the channel named only when there was a choice. */
export function getOtpSentMessage(input: {
  isResend: boolean;
  channel: OtpChannel;
  isWhatsAppAvailable: boolean;
}) {
  const via = input.isWhatsAppAvailable
    ? input.channel === 'whatsapp'
      ? ' by WhatsApp'
      : ' by SMS'
    : '';
  return input.isResend
    ? `Collection OTP resent to the customer${via}`
    : `Collection OTP sent${via}`;
}
