import { describe, expect, test } from 'bun:test';
import {
  formatPsw,
  getDialUrl,
  normalizePhone,
  validateSecondReceiver,
} from './call-center-outcome';

describe('mobile call-center outcome helpers', () => {
  test('normalizes a local phone number to ten digits', () => {
    expect(normalizePhone('024 966-7429')).toBe('0249667429');
  });

  test('validates an enabled second receiver', () => {
    expect(validateSecondReceiver(true, '', '0249667429')).toContain('required');
    expect(validateSecondReceiver(true, 'Ama', '0249')).toContain('10 digits');
    expect(validateSecondReceiver(true, 'Ama', '0249667429')).toBeNull();
    expect(validateSecondReceiver(false, '', '')).toBeNull();
  });

  test('formats receiver payment values from pesewas', () => {
    expect(formatPsw(5000)).toBe('GHS 50.00');
  });

  test('builds a dial-pad URL without display separators', () => {
    expect(getDialUrl('024 966-7429')).toBe('tel:0249667429');
    expect(getDialUrl('+233 24 966 7429')).toBe('tel:+233249667429');
    expect(getDialUrl('')).toBeNull();
  });
});
