import type { useReceiverCashierDialogState } from './use-receiver-cashier-dialog-state';

type ReceiverCashierDialog = ReturnType<typeof useReceiverCashierDialogState>;

export function useReceiverOtpActions({ dialog }: { dialog: ReceiverCashierDialog }) {
  return { handleRequestOtp: dialog.otp.request, handleVerifyOtp: dialog.otp.verify };
}
