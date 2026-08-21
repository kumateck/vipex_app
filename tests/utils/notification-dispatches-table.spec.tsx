import { describe, expect, it } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { NotificationDispatchesTable } from '@/features/notification-hub/components/notification-dispatches-list';
import type { NotificationDispatch } from '@/features/notification-hub/api/notification-hub.api';

const sentDispatch: NotificationDispatch = {
  id: 'dispatch-1',
  campaignId: null,
  campaignName: null,
  channel: 'sms',
  providerId: 'provider-1',
  providerKey: 'mnotify',
  recipientType: 'customer',
  recipientId: 'customer-1',
  recipientName: 'Ama Mensah',
  recipientAddress: '0244000000',
  subject: null,
  body: 'Your parcel is ready for pickup.',
  status: 'sent',
  attemptCount: 1,
  providerMessageId: 'message-1',
  errorMessage: null,
  metadataJson: null,
  createdAt: '2026-08-21T13:00:00.000Z',
  updatedAt: '2026-08-21T13:00:00.000Z',
};

describe('NotificationDispatchesTable', () => {
  it('shows the sent SMS message and a View action', () => {
    const markup = renderToStaticMarkup(
      <NotificationDispatchesTable
        rows={[sentDispatch]}
        isLoading={false}
        isRetrying={false}
        onView={() => undefined}
        onRetry={() => undefined}
      />,
    );

    expect(markup).toContain('Your parcel is ready for pickup.');
    expect(markup).toContain('View');
    expect(markup).not.toContain('Retry');
  });

  it('keeps the Retry action available for failed messages', () => {
    const markup = renderToStaticMarkup(
      <NotificationDispatchesTable
        rows={[{ ...sentDispatch, status: 'failed', errorMessage: 'Provider rejected message' }]}
        isLoading={false}
        isRetrying={false}
        onView={() => undefined}
        onRetry={() => undefined}
      />,
    );

    expect(markup).toContain('Provider rejected message');
    expect(markup).toContain('Retry');
  });
});
