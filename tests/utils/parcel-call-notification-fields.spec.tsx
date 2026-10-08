import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelCallNotificationFields } from '@/features/operations/parcel/components/parcel-status/parcel-call-notification-fields';

test('bulk SMS uses a checked accessible control and explains the recipients', () => {
  const markup = renderToStaticMarkup(
    <ParcelCallNotificationFields
      idPrefix="bulk-call"
      sendSms
      onSendSmsChange={() => {}}
      smsDescription="Each selected customer receives an SMS."
    />,
  );
  expect(markup).toContain('Send SMS');
  expect(markup).toContain('aria-checked="true"');
  expect(markup).toContain('for="bulk-call-send-sms"');
  expect(markup).toContain('Each selected customer receives an SMS.');
  expect(markup).not.toContain('Send Email');
});

test('notification controls disable during saving and preserve the single email option', () => {
  const markup = renderToStaticMarkup(
    <ParcelCallNotificationFields
      sendSms={false}
      onSendSmsChange={() => {}}
      sendEmail
      onSendEmailChange={() => {}}
      disabled
    />,
  );
  expect(markup).toContain('aria-checked="false"');
  expect(markup).toContain('Send Email');
  expect(markup).toContain('disabled=""');
});
