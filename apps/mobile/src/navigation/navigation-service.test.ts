import { describe, expect, test } from 'bun:test';
import { resolveMobileHref } from './navigation-route-resolver';

describe('mobile frontline navigation', () => {
  test.each([
    ['/(app)/receive', 'Receive'],
    ['/(app)/self-service', 'SelfService'],
    ['/(app)/call-center-follow-up', 'CallCenterFollowUp'],
    ['/(app)/receive-discrepancies', 'ReceiveDiscrepancies'],
    ['/(app)/delivery-change-reviews', 'DeliveryChangeReviews'],
    ['/(app)/customers', 'Customers'],
  ])('maps %s to its registered native screen', (href, expectedRoute) => {
    expect(resolveMobileHref(href)).toEqual({ name: expectedRoute, params: {} });
  });

  test('preserves query parameters when opening a registered screen', () => {
    expect(resolveMobileHref('/(app)/self-service?status=pending')).toEqual({
      name: 'SelfService',
      params: { status: 'pending' },
    });
  });
});
