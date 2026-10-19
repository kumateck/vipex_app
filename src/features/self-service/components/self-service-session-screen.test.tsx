import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { SelfServiceSessionScreen } from './self-service-session-screen';

describe('self-service session recovery screen', () => {
  test('offers a fresh booking instead of requiring another QR scan', () => {
    const html = renderToStaticMarkup(
      <SelfServiceSessionScreen state="expired" onRetry={() => {}} />,
    );
    expect(html).toContain('Start new booking');
    expect(html).not.toContain('Scan the QR code again');
    expect(html).not.toContain('has expired or has already been used');
  });
  test('disables retry while a session is being created', () => {
    const html = renderToStaticMarkup(
      <SelfServiceSessionScreen state="error" onRetry={() => {}} isRetrying />,
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('Try again');
  });
});
