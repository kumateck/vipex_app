import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { AwaitingPickupMatchesNotice } from './awaiting-pickup-matches-notice';

test('points Receiver signatures searches to matching Awaiting Pickup parcels', () => {
  const html = renderToStaticMarkup(
    <AwaitingPickupMatchesNotice count={1} search="AN2524984O" onShow={() => undefined} />,
  );
  expect(html).toContain('1 parcel matching “AN2524984O” has no signature request yet');
  expect(html).toContain('delivery was reversed');
  expect(html).toContain('Show in Awaiting Pickup');
  expect(
    renderToStaticMarkup(
      <AwaitingPickupMatchesNotice count={3} search="0244" onShow={() => undefined} />,
    ),
  ).toContain('3 parcels matching “0244” have no signature request yet and are under');
});
