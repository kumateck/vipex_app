import { describe, expect, test } from 'bun:test';
import { getCallOutcomeNotificationFeedback } from './call-outcome-notification-feedback';

describe('call outcome notification feedback', () => {
  test('reports resend results independently of saving the outcome', () => {
    expect(getCallOutcomeNotificationFeedback({ sentCount: 1, failedCount: 0 }, 'resend')).toEqual({
      kind: 'success',
      message: 'Notification resend complete. Notifications sent: 1.',
    });
    const failed = getCallOutcomeNotificationFeedback({ sentCount: 0, failedCount: 1 }, 'resend');
    expect(failed.kind).toBe('warning');
    expect(failed.message).toBe('Notification resend complete. Notifications sent: 0, failed: 1.');
    expect(failed.description).toContain('Dispatch Logs');
  });
  test('shows the provider failure alongside the saved outcome and exact counts', () => {
    const feedback = getCallOutcomeNotificationFeedback({
      sentCount: 0,
      failedCount: 1,
      failures: [
        { channel: 'sms', recipientType: 'receiver', message: 'mNotify service error (HTTP 500).' },
      ],
    });
    expect(feedback).toEqual({
      kind: 'warning',
      message: 'Outcome saved. Notifications sent: 0, failed: 1.',
      description: 'SMS to receiver: mNotify service error (HTTP 500).',
      duration: 10_000,
    });
  });

  test('distinguishes secondary-recipient email failure after a successful send', () => {
    const feedback = getCallOutcomeNotificationFeedback({
      sentCount: 1,
      failedCount: 2,
      failures: [
        { channel: 'sms', recipientType: 'receiver', message: 'No default provider' },
        { channel: 'email', recipientType: 'second_receiver', message: 'SMTP unavailable' },
      ],
    });
    expect(feedback.description).toBe(
      'SMS to receiver: No default provider\nEmail to second receiver: SMTP unavailable',
    );
    expect(feedback.message).toContain('sent: 1, failed: 2');
  });

  test.each([{ failures: undefined }, { failures: [] }])(
    'supports older servers and empty failure details: %j',
    ({ failures }) => {
      const feedback = getCallOutcomeNotificationFeedback({
        sentCount: 0,
        failedCount: 1,
        failures,
      });
      expect(feedback.kind).toBe('warning');
      expect(feedback.description).toContain('Dispatch Logs');
    },
  );

  test('keeps successful notification feedback unchanged', () => {
    expect(
      getCallOutcomeNotificationFeedback({ sentCount: 2, failedCount: 0, failures: [] }),
    ).toEqual({
      kind: 'success',
      message: 'Outcome saved. Notifications sent: 2.',
    });
  });
});
