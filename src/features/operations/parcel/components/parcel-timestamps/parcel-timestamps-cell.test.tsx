import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelTimestampsCell } from './parcel-timestamps-cell';

test('shows creation and receipt dates in one cell', () => {
  const createdAt = new Date(2026, 0, 2, 14, 30).toISOString();
  const receivedAt = new Date(2026, 0, 3, 9, 15).toISOString();
  const markup = renderToStaticMarkup(
    <ParcelTimestampsCell createdAt={createdAt} receivedAt={receivedAt} />,
  );
  expect(markup).toContain('Created:');
  expect(markup).toContain('02 Jan 2026, 14:30');
  expect(markup).toContain('Received:');
  expect(markup).toContain('03 Jan 2026, 09:15');
});
