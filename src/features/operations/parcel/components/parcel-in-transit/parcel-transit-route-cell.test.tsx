import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { ParcelTransitRouteCell } from './parcel-transit-route-cell';

describe('ParcelTransitRouteCell', () => {
  test('shows source and destination branch and location in one route column', () => {
    const parcel = {
      sourceName: 'Asafo',
      sourceLocationName: 'Main Office',
      destinationName: 'Circle',
      pickupLocationName: 'VIP Station',
    } as ParcelSearchRow;

    const markup = renderToStaticMarkup(<ParcelTransitRouteCell parcel={parcel} />);

    expect(markup).toContain('From:');
    expect(markup).toContain('Asafo');
    expect(markup).toContain('Main Office');
    expect(markup).toContain('To:');
    expect(markup).toContain('Circle');
    expect(markup).toContain('VIP Station');
  });
});
