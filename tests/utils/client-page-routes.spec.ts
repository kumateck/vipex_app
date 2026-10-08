import { describe, expect, test } from 'bun:test';
import { matchRoutes, type RouteObject } from 'react-router-dom';
import { routes } from '../../src/routes/generated';

describe('parcel workflow client page registration', () => {
  test.each([
    '/parcels/shelf-pickup-reassignment',
    '/parcels/storage-clearances',
    '/parcels/storage-clearances/new',
    '/parcels/storage-clearances/approvals',
    '/parcels/storage-clearances/execution',
  ])('%s resolves to its page inside the protected layout', (pathname) => {
    const matches = matchRoutes(routes as RouteObject[], pathname);

    expect(matches).not.toBeNull();
    expect(matches?.some(({ route }) => route.id === 'layout-1')).toBe(true);
    expect(matches?.at(-1)?.route.path).toBe(pathname.slice(1));
    expect(matches?.at(-1)?.route.Component).toBeDefined();
  });

  test('reassignment links with a booking search resolve to the same page', () => {
    const matches = matchRoutes(
      routes as RouteObject[],
      '/parcels/shelf-pickup-reassignment?search=VPX123',
    );

    expect(matches?.at(-1)?.route.path).toBe('parcels/shelf-pickup-reassignment');
  });
});
