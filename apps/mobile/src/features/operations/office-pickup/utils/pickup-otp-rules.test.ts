import { describe, expect, test } from 'bun:test';
import {
  formatCountdown,
  getOtpSendLabel,
  getOtpSentMessage,
  getRemainingSeconds,
  isCompleteOtp,
  resolveOtpChannel,
  sanitizeOtpInput,
} from './pickup-otp-rules';

describe('office pickup OTP rules', () => {
  test('keeps only six digits of what staff type', () => {
    expect(sanitizeOtpInput('12a3 45-678')).toBe('123456');
    expect(isCompleteOtp('12345')).toBe(false);
    expect(isCompleteOtp('123456')).toBe(true);
  });

  test('sends by WhatsApp only when the company has it available', () => {
    expect(resolveOtpChannel('whatsapp', true)).toBe('whatsapp');
    expect(resolveOtpChannel('whatsapp', false)).toBe('sms');
    expect(resolveOtpChannel('sms', true)).toBe('sms');
  });

  test('counts down to expiry and stops at zero', () => {
    const now = Date.parse('2026-11-08T10:00:00.000Z');
    expect(getRemainingSeconds('2026-11-08T10:05:00.000Z', now)).toBe(300);
    expect(getRemainingSeconds('2026-11-08T09:59:00.000Z', now)).toBe(0);
    expect(getRemainingSeconds(null, now)).toBe(0);
    expect(getRemainingSeconds('not a date', now)).toBe(0);
    expect(formatCountdown(299)).toBe('4:59');
    expect(formatCountdown(5)).toBe('0:05');
  });

  test('the shared countdown keeps the code input available through the final millisecond', () => {
    const expiry = '2026-11-08T10:10:00.000Z';
    const timestamp = Date.parse(expiry);
    expect(getRemainingSeconds(expiry, timestamp - 1)).toBe(1);
    expect(getRemainingSeconds(expiry, timestamp)).toBe(0);
    expect(getRemainingSeconds(expiry, timestamp + 1)).toBe(0);
  });

  test('labels the send button for first send, resend and in-flight', () => {
    expect(getOtpSendLabel({ pending: false, sent: false })).toBe('Send Collection OTP');
    expect(getOtpSendLabel({ pending: false, sent: true })).toBe('Resend OTP');
    expect(getOtpSendLabel({ pending: true, sent: true })).toBe('Sending…');
  });

  test('names the channel in the confirmation only when there was a choice', () => {
    expect(getOtpSentMessage({ isResend: false, channel: 'sms', isWhatsAppAvailable: false })).toBe(
      'Collection OTP sent',
    );
    expect(
      getOtpSentMessage({ isResend: true, channel: 'whatsapp', isWhatsAppAvailable: true }),
    ).toBe('Collection OTP resent to the customer by WhatsApp');
  });
});
