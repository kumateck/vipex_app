import type { ParcelCallNotificationSummary } from '@/shared/notification-hub';

export function getCallOutcomeNotificationFeedback(
  notification: ParcelCallNotificationSummary,
  action: 'save' | 'resend' = 'save',
) {
  const prefix = action === 'resend' ? 'Notification resend complete.' : 'Outcome saved.';
  if (notification.failedCount === 0) {
    return {
      kind: 'success' as const,
      message: `${prefix} Notifications sent: ${notification.sentCount}.`,
    };
  }

  const details = notification.failures?.map((failure) => {
    const recipient = failure.recipientType === 'second_receiver' ? 'second receiver' : 'receiver';
    const channel = failure.channel === 'sms' ? 'SMS' : 'Email';
    return `${channel} to ${recipient}: ${failure.message}`;
  });

  return {
    kind: 'warning' as const,
    message: `${prefix} Notifications sent: ${notification.sentCount}, failed: ${notification.failedCount}.`,
    description: details?.length
      ? details.join('\n')
      : 'Check Notification Hub → Dispatch Logs for the failure reason.',
    duration: 10_000,
  };
}
