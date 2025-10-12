import { parseDurationToSeconds } from '../../src/server/utils/duration';
import { describe, test, expect } from 'bun:test';

describe('parseDurationToSeconds', () => {
  test('parses seconds, minutes, hours, days', () => {
    expect(parseDurationToSeconds('30s')).toBe(30);
    expect(parseDurationToSeconds('2m')).toBe(120);
    expect(parseDurationToSeconds('1h')).toBe(3600);
    expect(parseDurationToSeconds('3d')).toBe(259200);
  });

  test('throws on invalid inputs', () => {
    expect(() => parseDurationToSeconds('')).toThrow();
    expect(() => parseDurationToSeconds('abc')).toThrow();
    expect(() => parseDurationToSeconds('10w')).toThrow();
  });
});
