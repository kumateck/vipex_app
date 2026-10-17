import { describe, expect, test } from 'bun:test';
import { toMsisdn } from './phone-msisdn';

describe('toMsisdn', () => {
  test('converts a local Ghana number with the trunk 0', () => {
    expect(toMsisdn('0244123456')).toBe('233244123456');
  });

  test('strips separators', () => {
    expect(toMsisdn(' 024 412-3456 ')).toBe('233244123456');
    expect(toMsisdn('(024) 412 3456')).toBe('233244123456');
  });

  test('keeps numbers that already carry the country code', () => {
    expect(toMsisdn('+233244123456')).toBe('233244123456');
    expect(toMsisdn('233244123456')).toBe('233244123456');
    expect(toMsisdn('00233244123456')).toBe('233244123456');
  });

  test('adds the country code to a 9-digit subscriber number', () => {
    expect(toMsisdn('244123456')).toBe('233244123456');
  });

  test('keeps foreign international numbers', () => {
    expect(toMsisdn('+447700900123')).toBe('447700900123');
  });

  test('honours a different country code', () => {
    expect(toMsisdn('08031234567', '234')).toBe('2348031234567');
  });

  test('rejects empty and invalid values', () => {
    expect(toMsisdn(null)).toBeNull();
    expect(toMsisdn('')).toBeNull();
    expect(toMsisdn('   ')).toBeNull();
    expect(toMsisdn('abc')).toBeNull();
    expect(toMsisdn('0244')).toBeNull();
    expect(toMsisdn('+1234567890123456')).toBeNull();
  });
});
