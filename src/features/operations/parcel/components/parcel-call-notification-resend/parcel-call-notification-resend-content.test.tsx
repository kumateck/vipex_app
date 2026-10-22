import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelStatus } from '@/db/schemas/enums';
import { ParcelCallNotificationResendContent } from './parcel-call-notification-resend-content';
import { ParcelSavedOutcomesFilter } from '../parcel-status/parcel-saved-outcomes-filter';

const props = {
  parcel: {
    id: 'parcel',
    bookingCode: 'BOOK-123',
    secondReceiverId: 'second',
    status: ParcelStatus.AWAITING_PICKUP,
    callCenterCalledAt: '2026-10-20T07:00:00Z',
  },
  outcome: 'pickup' as const,
  sendSms: true,
  onSendSmsChange: () => {},
  sendEmail: false,
  onSendEmailChange: () => {},
  includeSecondReceiver: true,
  onIncludeSecondReceiverChange: () => {},
  isSending: false,
  onClose: () => {},
  onResend: async () => {},
};

describe('saved outcome resend controls', () => {
  test('shows the saved outcome and channel controls without outcome or receiver editing', () => {
    const markup = renderToStaticMarkup(<ParcelCallNotificationResendContent {...props} />);
    expect(markup).toContain('Booking: BOOK-123');
    expect(markup).toContain('Saved outcome: Customer will come (Awaiting Pickup)');
    expect(markup).toContain('Resend Notification');
    expect(markup).toContain('resend-call-send-sms');
    expect(markup).toContain('resend-call-send-email');
    expect(markup).toContain('Also notify the saved second receiver');
    expect(markup).not.toContain('Save Outcome');
    expect(markup).not.toContain('Change Main Receiver');
    expect(markup).not.toContain('Customer wants delivery');
  });
  test('only offers a second receiver when one is already saved', () => {
    const markup = renderToStaticMarkup(
      <ParcelCallNotificationResendContent
        {...props}
        parcel={{ ...props.parcel, secondReceiverId: null }}
      />,
    );
    expect(markup).not.toContain('Also notify the saved second receiver');
  });
  test('disables sending until a channel and valid saved outcome are selected', () => {
    for (const change of [{ sendSms: false, sendEmail: false }, { outcome: null }]) {
      const markup = renderToStaticMarkup(
        <ParcelCallNotificationResendContent {...props} {...change} />,
      );
      expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Resend Notification<\/button>/);
    }
  });
  test('locks the channel controls and resend button during an in-flight request', () => {
    const markup = renderToStaticMarkup(
      <ParcelCallNotificationResendContent {...props} isSending />,
    );
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Sending…<\/button>/);
    expect(markup.match(/<button[^>]*role="checkbox"[^>]*disabled=""/g)).toHaveLength(3);
  });
  test('labels the include-saved-outcomes filter and preserves its checked state', () => {
    const markup = renderToStaticMarkup(
      <ParcelSavedOutcomesFilter value onChange={() => {}} disabled={false} />,
    );
    expect(markup).toContain('Include saved outcomes');
    expect(markup).toContain('for="include-saved-call-outcomes"');
    expect(markup).toContain('aria-checked="true"');
  });
});
