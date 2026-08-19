import { useCallback, useState } from 'react';
import { useRequestReceiverOtpMutation, useVerifyReceiverOtpMutation } from '../../api/parcel.api';

type HandoverTarget = 'main' | 'second';

export function usePickupOtpVerification({
  parcelId,
  targetReceiver,
}: {
  parcelId: string | null;
  targetReceiver: HandoverTarget;
}) {
  const [otpSentAt, setOtpSentAt] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [requestOtp, { isLoading: otpRequestPending }] = useRequestReceiverOtpMutation();
  const [verifyOtp, { isLoading: otpVerifyPending }] = useVerifyReceiverOtpMutation();

  const reset = useCallback(() => {
    setOtpSentAt(null);
    setOtpExpiresAt(null);
    setOtpCode('');
    setOtpVerified(false);
    setVerificationToken('');
  }, []);

  const request = useCallback(
    async (force = false) => {
      if (!parcelId) return;
      const result = await requestOtp({ parcelId, targetReceiver, force }).unwrap();
      setOtpSentAt(new Date().toISOString());
      setOtpExpiresAt(result.expiresAt);
      setOtpCode('');
      setOtpVerified(false);
      setVerificationToken('');
    },
    [parcelId, requestOtp, targetReceiver],
  );

  const verify = useCallback(async () => {
    if (!parcelId) return;
    const result = await verifyOtp({ parcelId, targetReceiver, otp: otpCode }).unwrap();
    setOtpVerified(true);
    setVerificationToken(result.verificationToken);
  }, [otpCode, parcelId, targetReceiver, verifyOtp]);

  return {
    otpSentAt,
    otpExpiresAt,
    otpCode,
    setOtpCode,
    otpVerified,
    verificationToken,
    otpRequestPending,
    otpVerifyPending,
    request,
    verify,
    reset,
  };
}

export type PickupOtpVerification = ReturnType<typeof usePickupOtpVerification>;
