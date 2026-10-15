import { describe, expect, test } from 'bun:test';
import { getSelfServiceParcelError } from './self-service-parcel-validation';

describe('getSelfServiceParcelError', () => {
  test('accepts contents with a zero or comma-formatted value', () => {
    expect(getSelfServiceParcelError({ content: 'Books', value: '0' })).toBeNull();
    expect(getSelfServiceParcelError({ content: 'Books', value: '1,200.50' })).toBeNull();
  });

  test('rejects blank contents and invalid values', () => {
    expect(getSelfServiceParcelError({ content: '  ', value: '10' })).toBe(
      'Enter what is inside the parcel',
    );
    for (const value of ['', 'abc', '-1'])
      expect(getSelfServiceParcelError({ content: 'Books', value })).toBe(
        'Enter a valid declared value',
      );
  });
});
