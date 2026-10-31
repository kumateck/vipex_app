import { describe, expect, test } from 'bun:test';
import { getRequiredPickupLocationError } from './index';

const input = {
  destinationId: 'accra',
  pickupLocationId: 'circle',
  options: [{ id: 'circle', branchId: 'accra' }],
};
describe('required frontend pickup location', () => {
  test('booking and completion require a valid destination location', () => {
    expect(getRequiredPickupLocationError(input)).toBeNull();
    expect(getRequiredPickupLocationError({ ...input, pickupLocationId: '' })).toContain('Select');
    expect(getRequiredPickupLocationError({ ...input, destinationId: '' })).toContain(
      'destination',
    );
    expect(getRequiredPickupLocationError({ ...input, options: [] })).toContain('No receiving');
  });
  test('loading and failure block even a previously selected cached location', () => {
    expect(getRequiredPickupLocationError({ ...input, loading: true })).toContain('finish loading');
    expect(getRequiredPickupLocationError({ ...input, failed: true })).toContain('Retry');
  });
  test('stale, foreign-branch, disabled and deleted choices are refused', () => {
    for (const patch of [
      { id: 'old-location' },
      { branchId: 'kumasi' },
      { canReceive: false },
      { isDeleted: true },
    ]) {
      expect(
        getRequiredPickupLocationError({ ...input, options: [{ ...input.options[0]!, ...patch }] }),
      ).toContain('valid pickup');
    }
  });
});
