import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import {
  clearSelfServiceSession,
  hasSelfServiceScanLimit,
  setSelfServiceScanLimit,
  readSelfServiceSession,
  saveSelfServiceSession,
  selfServiceSessionKey,
} from './self-service-session-storage';

const session = {
  branchId: 'branch-a',
  branchName: 'Accra',
  sessionToken: 'token-a',
  issuedAt: '2026-10-19T12:00:00.000Z',
  expiresAt: '2026-10-19T12:15:00.000Z',
};
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
let values: Map<string, string>;

beforeEach(() => {
  values = new Map();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  });
});
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

describe('self-service session restoration', () => {
  test.each(['2026-10-18', '2026-10-19T12:16:00Z', '2027-10-19'])(
    'leaves expiry to the server when the phone clock reads %s',
    (date) => {
      const clock = spyOn(Date, 'now').mockReturnValue(Date.parse(date));
      try {
        saveSelfServiceSession(session);
        expect(readSelfServiceSession('branch-a')).toEqual(session);
      } finally {
        clock.mockRestore();
      }
    },
  );
  test('does not reuse another branch or corrupt browser entry', () => {
    for (const value of [
      'null',
      '{}',
      'bad-json',
      JSON.stringify({ ...session, branchId: 'branch-b' }),
      JSON.stringify({ ...session, sessionToken: '' }),
      JSON.stringify({ ...session, expiresAt: 'invalid' }),
    ]) {
      values.set(selfServiceSessionKey('branch-a'), value);
      expect(readSelfServiceSession('branch-a')).toBeNull();
    }
  });
  test('clears used sessions and starts empty for a fresh browser', () => {
    expect(readSelfServiceSession('branch-a')).toBeNull();
    saveSelfServiceSession(session);
    clearSelfServiceSession('branch-a');
    expect(readSelfServiceSession('branch-a')).toBeNull();
  });
  test('keeps exhausted scan state through token cleanup until a new scan', () => {
    setSelfServiceScanLimit('branch-a', true);
    clearSelfServiceSession('branch-a');
    expect(hasSelfServiceScanLimit('branch-a')).toBe(true);
    expect(hasSelfServiceScanLimit('branch-b')).toBe(false);
    setSelfServiceScanLimit('branch-a', false);
    expect(hasSelfServiceScanLimit('branch-a')).toBe(false);
  });
  test('blocked storage does not crash the in-memory flow', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        get sessionStorage() {
          throw new Error('Storage blocked');
        },
      },
    });
    expect(() => saveSelfServiceSession(session)).not.toThrow();
    expect(readSelfServiceSession('branch-a')).toBeNull();
    expect(() => clearSelfServiceSession('branch-a')).not.toThrow();
    expect(() => setSelfServiceScanLimit('branch-a', true)).not.toThrow();
    expect(hasSelfServiceScanLimit('branch-a')).toBe(false);
  });
});
