import type { ParcelCallNotificationFailure } from '@/shared/notification-hub';

export function buildParcelNotificationFailure(
  channel: ParcelCallNotificationFailure['channel'],
  recipientType: ParcelCallNotificationFailure['recipientType'],
  errorMessage?: string | null,
): ParcelCallNotificationFailure {
  const message = errorMessage?.trim() || 'The notification provider did not accept the message';
  return {
    channel,
    recipientType,
    message: message
      .replace(/([?&](?:key|api_key|apikey|token|access_token)=)[^\s&"']+/gi, '$1[REDACTED]')
      .slice(0, 500),
  };
}
