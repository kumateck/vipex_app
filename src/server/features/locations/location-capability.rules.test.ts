import { describe, expect, test } from 'bun:test';
import { assertReceivingLocation, assertSendingLocation } from './location-capability.rules';

const location = { companyId: 'company', branchId: 'branch', isDeleted: false, canReceive: true };
describe('destination location receiving capability', () => {
  test('accepts active receiving locations in the destination branch', () => {
    expect(() => assertReceivingLocation(location, 'company', 'branch')).not.toThrow();
  });
  test('receiving-only source locations cannot create outgoing parcels', () => {
    expect(() =>
      assertSendingLocation({ ...location, canSend: true }, 'company', 'branch'),
    ).not.toThrow();
    expect(() =>
      assertSendingLocation({ ...location, canSend: false }, 'company', 'branch'),
    ).toThrow('does not send');
  });
  test('rejects sending-only locations and foreign or deleted locations', () => {
    for (const candidate of [
      null,
      { ...location, isDeleted: true },
      { ...location, branchId: 'other' },
      { ...location, companyId: 'other' },
    ]) {
      expect(() => assertReceivingLocation(candidate, 'company', 'branch')).toThrow(
        'Select a valid destination location',
      );
    }
    expect(() =>
      assertReceivingLocation({ ...location, canReceive: false }, 'company', 'branch'),
    ).toThrow('does not receive');
  });
});
