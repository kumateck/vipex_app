import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { SelfServiceSuccessScreen } from './self-service-success-screen';

describe('self-service next booking', () => {
  test('offers New booking with the completed count before the limit', () => {
    const html = renderToStaticMarkup(
      <SelfServiceSuccessScreen branchName="Accra" bookingsCompleted={9} onNewBooking={() => {}} />,
    );
    expect(html).toContain('New booking');
    expect(html).toContain('9 of 10');
    expect(html).not.toContain('Scan the branch QR code again');
  });
  test('requires a rescan after the tenth booking', () => {
    const html = renderToStaticMarkup(
      <SelfServiceSuccessScreen branchName="Accra" bookingsCompleted={10} />,
    );
    expect(html).not.toContain('New booking</button>');
    expect(html).toContain('10 of 10');
    expect(html).toContain('Scan the branch QR code again');
  });
});
