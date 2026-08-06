import { useRequestReceiverOtpMutation, useVerifyReceiverOtpMutation } from '../../api/parcel.api';
import type { useReceiverCashierDialogState } from './use-receiver-cashier-dialog-state';

type ReceiverCashierDialog = ReturnType<typeof useReceiverCashierDialogState>;
type RequestReceiverOtp = ReturnType<typeof useRequestReceiverOtpMutation>[0];
type VerifyReceiverOtp = ReturnType<typeof useVerifyReceiverOtpMutation>[0];

export function useReceiverOtpActions({
  dialog,
  requestReceiverOtp,
  verifyReceiverOtp,
}: {
  dialog: ReceiverCashierDialog;
  requestReceiverOtp: RequestReceiverOtp;
  verifyReceiverOtp: VerifyReceiverOtp;
}) {
  const handleRequestOtp = async (force = false) => {
    if (!dialog.selectedParcel) return;
    dialog.setOtpRequestPending(true);
    try {
      const result = await requestReceiverOtp({
        parcelId: dialog.selectedParcel.id,
        targetReceiver: dialog.handoverTarget,
        force,
      }).unwrap();
      dialog.setOtpSentAt(new Date().toISOString());
      dialog.setOtpExpiresAt(result.expiresAt);
      dialog.setOtpVerified(false);
      dialog.setOtpVerificationToken('');
      dialog.setOtpCode('');
    } finally {
      dialog.setOtpRequestPending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!dialog.selectedParcel) return;
    dialog.setOtpVerifyPending(true);
    try {
      const result = await verifyReceiverOtp({
        parcelId: dialog.selectedParcel.id,
        targetReceiver: dialog.handoverTarget,
        otp: dialog.otpCode,
      }).unwrap();
      dialog.setOtpVerified(true);
      dialog.setOtpVerificationToken(result.verificationToken);
    } finally {
      dialog.setOtpVerifyPending(false);
    }
  };

  return { handleRequestOtp, handleVerifyOtp };
}
