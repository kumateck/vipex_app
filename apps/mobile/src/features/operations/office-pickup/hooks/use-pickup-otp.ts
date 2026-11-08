import { useCallback, useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { requestPickupOtp, verifyPickupOtp } from '../services';
import type { OtpChannel, PhoneSlot } from '../types';
import { getOtpSentMessage, isCompleteOtp, resolveOtpChannel, sanitizeOtpInput } from '../utils';

/**
 * Collection OTP for the main receiver, mirroring the web pickup dialog: the
 * code always targets the main receiver (it proves their presence), on the
 * chosen phone slot, by SMS or — when available — WhatsApp.
 */
export function usePickupOtp(input: {
  parcelId: string | null;
  phoneSlot: PhoneSlot;
  isWhatsAppAvailable: boolean;
}) {
  const { parcelId, phoneSlot, isWhatsAppAvailable } = input;
  const { withAuth } = useAuth();
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [code, setCodeState] = useState('');
  const [verified, setVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  // SMS or WhatsApp for the next send; a code already sent stays valid.
  const [channel, setChannel] = useState<OtpChannel>('sms');
  const [requestPending, setRequestPending] = useState(false);
  const [verifyPending, setVerifyPending] = useState(false);

  const reset = useCallback(() => {
    setSentAt(null);
    setExpiresAt(null);
    setCodeState('');
    setVerified(false);
    setVerificationToken('');
  }, []);

  const setCode = useCallback((value: string) => setCodeState(sanitizeOtpInput(value)), []);

  const request = useCallback(async () => {
    if (!parcelId) return;
    const isResend = Boolean(sentAt);
    const sendChannel = resolveOtpChannel(channel, isWhatsAppAvailable);
    setRequestPending(true);
    try {
      const result = await withAuth((token) =>
        requestPickupOtp(token, { parcelId, force: isResend, phoneSlot, channel: sendChannel }),
      );
      setSentAt(new Date().toISOString());
      setExpiresAt(result.expiresAt);
      setCodeState('');
      setVerified(false);
      setVerificationToken('');
      notifySuccess(
        getOtpSentMessage({ isResend, channel: sendChannel, isWhatsAppAvailable }),
        'OTP sent',
      );
    } catch (error) {
      notifyError(
        'OTP not sent',
        getMobileErrorMessage(error, '') || 'Failed to send collection OTP',
      );
    } finally {
      setRequestPending(false);
    }
  }, [channel, isWhatsAppAvailable, parcelId, phoneSlot, sentAt, withAuth]);

  const verify = useCallback(async () => {
    if (!parcelId || !isCompleteOtp(code)) return;
    setVerifyPending(true);
    try {
      const result = await withAuth((token) => verifyPickupOtp(token, { parcelId, otp: code }));
      setVerified(true);
      setVerificationToken(result.verificationToken);
      notifySuccess('Customer presence confirmed', 'OTP verified');
    } catch (error) {
      notifyError('OTP not verified', getMobileErrorMessage(error, '') || 'Invalid collection OTP');
    } finally {
      setVerifyPending(false);
    }
  }, [code, parcelId, withAuth]);

  return {
    sentAt,
    expiresAt,
    code,
    setCode,
    verified,
    verificationToken,
    channel,
    setChannel,
    requestPending,
    verifyPending,
    request,
    verify,
    reset,
  };
}

export type PickupOtp = ReturnType<typeof usePickupOtp>;
