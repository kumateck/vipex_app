import { useCallback, useEffect, useRef, useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { getPickupOtpSession, requestPickupOtp, verifyPickupOtp } from '../services';
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
  onPhoneSlotRestored?: (slot: PhoneSlot) => void;
}) {
  const { parcelId, phoneSlot, isWhatsAppAvailable, onPhoneSlotRestored } = input;
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
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );

  const reset = useCallback(() => {
    generation.current++;
    setSentAt(null);
    setExpiresAt(null);
    setCodeState('');
    setVerified(false);
    setVerificationToken('');
    setRequestPending(false);
    setVerifyPending(false);
    setRestoring(false);
    setRestoreError('');
  }, []);

  const restore = useCallback(
    async (id: string) => {
      reset();
      const current = generation.current;
      setRestoring(true);
      try {
        const saved = await withAuth((token) => getPickupOtpSession(token, id));
        if (current !== generation.current || !saved) return;
        setSentAt(saved.sentAt);
        setExpiresAt(saved.expiresAt);
        setChannel(saved.channel);
        setVerified(Boolean(saved.verificationToken));
        setVerificationToken(saved.verificationToken ?? '');
        onPhoneSlotRestored?.(saved.phoneSlot);
        return true;
      } catch (error) {
        if (current === generation.current)
          setRestoreError(
            getMobileErrorMessage(error, '') || 'Could not restore OTP. Retry to continue.',
          );
      } finally {
        if (current === generation.current) setRestoring(false);
      }
    },
    [onPhoneSlotRestored, reset, withAuth],
  );

  const setCode = useCallback((value: string) => setCodeState(sanitizeOtpInput(value)), []);

  const request = useCallback(async () => {
    if (!parcelId) return;
    const current = ++generation.current;
    const isResend = Boolean(sentAt);
    const sendChannel = resolveOtpChannel(channel, isWhatsAppAvailable);
    setRequestPending(true);
    try {
      const result = await withAuth((token) =>
        requestPickupOtp(token, { parcelId, force: isResend, phoneSlot, channel: sendChannel }),
      );
      if (current !== generation.current) return;
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
      if (current !== generation.current) return;
      if (
        !isResend &&
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 409
      ) {
        if (await restore(parcelId)) return;
      }
      notifyError(
        'OTP not sent',
        getMobileErrorMessage(error, '') || 'Failed to send collection OTP',
      );
    } finally {
      if (current === generation.current) setRequestPending(false);
    }
  }, [channel, isWhatsAppAvailable, parcelId, phoneSlot, restore, sentAt, withAuth]);

  const verify = useCallback(async () => {
    if (!parcelId || !isCompleteOtp(code)) return;
    const current = ++generation.current;
    setVerifyPending(true);
    try {
      const result = await withAuth((token) => verifyPickupOtp(token, { parcelId, otp: code }));
      if (current !== generation.current) return;
      setVerified(true);
      setVerificationToken(result.verificationToken);
      notifySuccess('Customer presence confirmed', 'OTP verified');
    } catch (error) {
      if (current !== generation.current) return;
      notifyError('OTP not verified', getMobileErrorMessage(error, '') || 'Invalid collection OTP');
    } finally {
      if (current === generation.current) setVerifyPending(false);
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
    requestPending: requestPending || restoring,
    verifyPending,
    request,
    verify,
    reset,
    restore,
    restoreError,
    restoring,
    retryRestore: () => (parcelId ? restore(parcelId) : undefined),
  };
}

export type PickupOtp = ReturnType<typeof usePickupOtp>;
