import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  useLazyGetReceiverOtpSessionQuery,
  useRequestReceiverOtpMutation,
  useVerifyReceiverOtpMutation,
} from '../api/parcel.api';

type PhoneSlot = 'primary' | 'secondary';
type Channel = 'sms' | 'whatsapp';
const EMPTY_SESSION = {
  otpSentAt: null as string | null,
  otpExpiresAt: null as string | null,
  otpCode: '',
  otpVerified: false,
  verificationToken: '',
};

export function useReceiverOtpSession({
  parcelId,
  targetReceiver,
  phoneSlot = 'primary',
  onPhoneSlotRestored,
}: {
  parcelId: string | null;
  targetReceiver: 'main' | 'second';
  phoneSlot?: PhoneSlot;
  onPhoneSlotRestored?: (value: PhoneSlot) => void;
}) {
  const [session, setSession] = useState(EMPTY_SESSION);
  const [otpChannel, setOtpChannel] = useState<Channel>('sms');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const [getStatus] = useLazyGetReceiverOtpSessionQuery();
  const [requestOtp, { isLoading: requestPending }] = useRequestReceiverOtpMutation();
  const [verifyOtp, { isLoading: verifyPending }] = useVerifyReceiverOtpMutation();

  const reset = useCallback(() => {
    generation.current++;
    setSession(EMPTY_SESSION);
    setIsRestoring(false);
    setRestoreError('');
  }, []);
  const restore = useCallback(
    async (id: string) => {
      reset();
      const current = generation.current;
      setIsRestoring(true);
      try {
        const saved = await getStatus({ parcelId: id, targetReceiver }, false).unwrap();
        if (current !== generation.current || !saved) return;
        setSession({
          otpSentAt: saved.sentAt,
          otpExpiresAt: saved.expiresAt,
          otpCode: '',
          otpVerified: Boolean(saved.verificationToken),
          verificationToken: saved.verificationToken ?? '',
        });
        setOtpChannel(saved.channel);
        onPhoneSlotRestored?.(saved.phoneSlot);
        return true;
      } catch (error) {
        if (current === generation.current)
          setRestoreError(getErrorMessage(error, 'Could not restore OTP. Retry to continue.'));
      } finally {
        if (current === generation.current) setIsRestoring(false);
      }
    },
    [getStatus, onPhoneSlotRestored, reset, targetReceiver],
  );
  const request = useCallback(
    async (force = false) => {
      if (!parcelId) return;
      const current = ++generation.current;
      try {
        const result = await requestOtp({
          parcelId,
          targetReceiver,
          force,
          phoneSlot,
          channel: otpChannel,
        }).unwrap();
        if (current !== generation.current) return false;
        setRestoreError('');
        setSession({
          ...EMPTY_SESSION,
          otpSentAt: new Date().toISOString(),
          otpExpiresAt: result.expiresAt,
        });
        return true;
      } catch (error) {
        if (current !== generation.current) return false;
        if (
          !force &&
          error &&
          typeof error === 'object' &&
          'status' in error &&
          error.status === 409
        ) {
          if (await restore(parcelId)) return false;
        }
        throw error;
      }
    },
    [otpChannel, parcelId, phoneSlot, requestOtp, restore, targetReceiver],
  );
  const verify = useCallback(async () => {
    if (!parcelId) return;
    const current = ++generation.current;
    const result = await verifyOtp({ parcelId, targetReceiver, otp: session.otpCode }).unwrap();
    if (current !== generation.current) return;
    setSession((previous) => ({
      ...previous,
      otpVerified: true,
      verificationToken: result.verificationToken,
    }));
  }, [parcelId, session.otpCode, targetReceiver, verifyOtp]);

  return {
    ...session,
    otpChannel,
    setOtpChannel,
    restoreError,
    isRestoring,
    setOtpCode: (otpCode: string) => setSession((previous) => ({ ...previous, otpCode })),
    otpRequestPending: requestPending || isRestoring,
    otpVerifyPending: verifyPending,
    request,
    verify,
    reset,
    restore,
    retryRestore: () => (parcelId ? restore(parcelId) : undefined),
  };
}

export type ReceiverOtpSessionState = ReturnType<typeof useReceiverOtpSession>;
