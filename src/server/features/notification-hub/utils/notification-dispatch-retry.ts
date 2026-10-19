import { Conflict } from '@/server/utils/http-error';

export function assertDispatchCanBeRetried(metadata: unknown) {
  if (
    metadata &&
    typeof metadata === 'object' &&
    'eventCode' in metadata &&
    metadata.eventCode === 'receiver_pickup_otp'
  ) {
    throw Conflict(
      'Request a fresh pickup OTP from Receiver Cashier or Waiting for Pickup; OTP notification logs cannot be resent',
    );
  }
}
