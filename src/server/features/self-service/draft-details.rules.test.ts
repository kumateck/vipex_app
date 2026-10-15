import { describe, expect, test } from 'bun:test';
import { normalizeDraftParcel } from './draft-details.rules';

describe('normalizeDraftParcel', () => {
  test('trims content and converts cedis to pesewas', () => {
    expect(
      normalizeDraftParcel({ parcelContent: '  Books ', parcelValueCedis: '1,250.50' }),
    ).toEqual({
      parcelContent: 'Books',
      parcelValuePsw: 125050,
    });
    expect(
      normalizeDraftParcel({ parcelContent: 'Shoes', parcelValueCedis: 0 }).parcelValuePsw,
    ).toBe(0);
  });

  test('rejects blank content and invalid values', () => {
    expect(() => normalizeDraftParcel({ parcelContent: ' ', parcelValueCedis: 10 })).toThrow(
      'Parcel content is required',
    );
    for (const parcelValueCedis of ['', 'abc', -1])
      expect(() => normalizeDraftParcel({ parcelContent: 'Books', parcelValueCedis })).toThrow(
        'Enter a valid parcel value',
      );
  });
});
