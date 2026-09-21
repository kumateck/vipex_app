import { describe, expect, test } from 'bun:test';
import { resolveShelfPickerStaffId } from './resolve-shelf-picker-staff-id';

describe('resolveShelfPickerStaffId', () => {
  test('uses the parcel assignment when pickup queues are disabled', () => {
    expect(
      resolveShelfPickerStaffId({
        parcel: { shelfPickerStaffId: 'parcel-picker' },
        pickupQueue: null,
      }),
    ).toBe('parcel-picker');
  });

  test('keeps compatibility with an existing pickup queue assignment', () => {
    expect(
      resolveShelfPickerStaffId({
        parcel: { shelfPickerStaffId: null },
        pickupQueue: { pickerStaffId: 'queue-picker' },
      }),
    ).toBe('queue-picker');
  });

  test('prefers the parcel assignment after an update', () => {
    expect(
      resolveShelfPickerStaffId({
        parcel: { shelfPickerStaffId: 'updated-picker' },
        pickupQueue: { pickerStaffId: 'legacy-picker' },
      }),
    ).toBe('updated-picker');
  });
});
