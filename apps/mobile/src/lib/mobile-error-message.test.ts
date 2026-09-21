import { describe, expect, test } from 'bun:test';
import { getMobileErrorMessage } from './mobile-error-message';

describe('getMobileErrorMessage', () => {
  test('reads the API nested error contract', () => {
    expect(
      getMobileErrorMessage({
        status: 429,
        data: { error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
      }),
    ).toBe('Too many requests.');
  });

  test('reads validation errors and falls back when no message exists', () => {
    expect(getMobileErrorMessage({ errors: { phone: ['Enter a valid phone number.'] } })).toBe(
      'Enter a valid phone number.',
    );
    expect(getMobileErrorMessage({ status: 500 }, 'Unable to continue.')).toBe(
      'Unable to continue.',
    );
  });

  test('prefers the server response and safely handles cyclic wrappers', () => {
    expect(
      getMobileErrorMessage({
        message: 'Request failed',
        response: { data: { error: { message: 'This parcel was already received.' } } },
      }),
    ).toBe('This parcel was already received.');

    const cyclic: { data?: unknown; message: string } = { message: 'Safe mobile message' };
    cyclic.data = cyclic;
    expect(getMobileErrorMessage(cyclic)).toBe('Safe mobile message');
  });
});
