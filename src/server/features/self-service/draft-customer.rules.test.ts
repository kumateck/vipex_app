import { describe, expect, test } from 'bun:test';
import { normalizeDraftContact } from './draft-customer.rules';

describe('self-service customer corrections', () => {
  test('normalizes names, phone separators and blank backup numbers', () => {
    expect(
      normalizeDraftContact({ fullname: '  Receiver  ', phone: '024 000-0000', phone2: ' ' }),
    ).toEqual({ fullname: 'Receiver', phone: '0240000000', phone2: null });
  });
  test('rejects missing names, oversize names, invalid primary and backup numbers', () => {
    for (const contact of [
      { fullname: '', phone: '0240000000' },
      { fullname: 'x'.repeat(256), phone: '0240000000' },
      { fullname: 'Receiver', phone: 'not-a-number' },
      { fullname: 'Receiver', phone: '0240000000', phone2: '02400' },
    ])
      expect(() => normalizeDraftContact(contact)).toThrow();
  });
});
