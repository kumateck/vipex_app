export const MIN_OTP_EXCEPTION_REASON_LENGTH = 10;
export const MAX_OTP_EXCEPTION_REASON_LENGTH = 500;

export function isOtpExceptionReason(value: string) {
  const length = value.trim().length;
  return length >= MIN_OTP_EXCEPTION_REASON_LENGTH && length <= MAX_OTP_EXCEPTION_REASON_LENGTH;
}

export const OTP_AUTHORIZATION_MINUTES = 10;

export type OtpAuthorizationWorkflow = 'office_pickup' | 'receiver_cashier';
export type OtpAuthorizationTarget = 'main' | 'second';

export type PickupOtpAuthorization = {
  id: string;
  expiresAt: string;
  handoverTarget: OtpAuthorizationTarget;
};
