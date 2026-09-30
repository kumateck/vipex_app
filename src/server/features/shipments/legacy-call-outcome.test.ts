import { describe, expect, test } from 'bun:test';
import { legacyCallOutcomeFromParcelPatch } from './legacy-call-outcome';

describe('legacy call outcome routing', () => {
  test('recognizes the old caller payloads', () => {
    expect(legacyCallOutcomeFromParcelPatch({ status: 5, secondReceiverId: null })).toBe('pickup');
    expect(legacyCallOutcomeFromParcelPatch({ status: 7, secondReceiverId: 'receiver' })).toBe(
      'delivery',
    );
  });

  test('leaves unrelated parcel updates on the normal update path', () => {
    expect(legacyCallOutcomeFromParcelPatch({ status: 5 })).toBeNull();
    expect(
      legacyCallOutcomeFromParcelPatch({ status: 5, secondReceiverId: null, parcelDetails: 'Box' }),
    ).toBeNull();
    expect(legacyCallOutcomeFromParcelPatch({ status: 6, secondReceiverId: null })).toBeNull();
  });
});
