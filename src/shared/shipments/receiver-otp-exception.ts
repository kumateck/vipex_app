import type { ParcelReceivingOffice } from './receiving-office';

export const MIN_OTP_EXCEPTION_REASON_LENGTH = 10;
export const MAX_OTP_EXCEPTION_REASON_LENGTH = 500;

export function isOtpExceptionReason(value: string) {
  const length = value.trim().length;
  return length >= MIN_OTP_EXCEPTION_REASON_LENGTH && length <= MAX_OTP_EXCEPTION_REASON_LENGTH;
}

export const OTP_AUTHORIZATION_MINUTES = 10;

export type OtpAuthorizationWorkflow = 'office_pickup' | 'receiver_cashier';
export type OtpAuthorizationTarget = 'main' | 'second';

export const OTP_AUTHORIZATION_WORKFLOW_LABELS: Record<OtpAuthorizationWorkflow, string> = {
  receiver_cashier: 'Receiver Cashier',
  office_pickup: 'Waiting for Pickup',
};

export type OtpApprovalParcel = {
  id: string;
  receiverId: string;
  receiverNameSnapshot: string;
  secondReceiverId: string | null;
  secondReceiverNameSnapshot: string | null;
};

export type OtpApprovalQueueItem = OtpApprovalParcel &
  ParcelReceivingOffice & {
    bookingCode: string;
    trackingCode: string;
    destinationName: string;
    otpRequestId: string;
    otpTarget: string;
    otpRequestedAt: string;
    otpExpired: boolean;
  };

export type OtpApprovalQueueQuery = {
  workflow: OtpAuthorizationWorkflow;
  page?: number;
  pageSize?: number;
  search?: string;
};

export type OtpApprovalQueue = {
  items: OtpApprovalQueueItem[];
  hasNextPage: boolean;
};

export type PickupOtpAuthorization = {
  id: string;
  expiresAt: string;
  handoverTarget: OtpAuthorizationTarget;
};
