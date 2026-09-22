import { describe, expect, test } from 'bun:test';
import {
  createHardReloadUrl,
  getErrorMessage,
  getNextStaleBuildReloadAttempt,
  isAbortError,
  isLikelyStaleBuildError,
} from './TheAduseiErrorResponse';

describe('isAbortError', () => {
  test('recognizes cancellation errors without treating them as user-facing failures', () => {
    expect(isAbortError('Aborted')).toBe(true);
    expect(isAbortError(new DOMException('The operation was aborted.', 'AbortError'))).toBe(true);
    expect(isAbortError('Invalid OTP')).toBe(false);
  });
});

describe('isLikelyStaleBuildError', () => {
  test.each([
    'Failed to fetch dynamically imported module: https://app.example/assets/page-old.js',
    'ChunkLoadError: Loading chunk 42 failed',
    'Importing a module script failed',
  ])('recognizes recoverable lazy-chunk failures', (message) => {
    expect(isLikelyStaleBuildError(new TypeError(message))).toBe(true);
  });

  test('does not reload for unrelated application errors', () => {
    expect(isLikelyStaleBuildError(new Error('Parcel was not found'))).toBe(false);
  });

  test('creates a cache-busted reload URL with its bounded attempt number', () => {
    expect(createHardReloadUrl('https://app.example/parcels?filter=incoming', 1234, 3)).toBe(
      'https://app.example/parcels?filter=incoming&__hard_reload=1234&__reload_attempt=3',
    );
  });

  test('allows no more than three automatic reload attempts', () => {
    expect(getNextStaleBuildReloadAttempt(0)).toBe(1);
    expect(getNextStaleBuildReloadAttempt(2)).toBe(3);
    expect(getNextStaleBuildReloadAttempt(3)).toBeNull();
    expect(getNextStaleBuildReloadAttempt(99)).toBeNull();
  });

  test('reads the nested API error contract before using a fallback', () => {
    expect(
      getErrorMessage(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please retry shortly.' } },
        'Failed to fetch data',
      ),
    ).toBe('Too many requests. Please retry shortly.');

    expect(
      getErrorMessage(
        { data: { error: { message: 'You do not have permission to assign this parcel.' } } },
        'Failed to assign parcel',
      ),
    ).toBe('You do not have permission to assign this parcel.');

    expect(
      getErrorMessage(
        { status: 422, data: { errors: { phone: ['Enter a valid phone number.'] } } },
        'Failed to save customer',
      ),
    ).toBe('Enter a valid phone number.');
  });

  test('prefers a server response over a generic transport message', () => {
    expect(
      getErrorMessage({
        message: 'Request failed with status code 409',
        response: { data: { error: { message: 'This parcel was already assigned.' } } },
      }),
    ).toBe('This parcel was already assigned.');
  });

  test('handles string validation arrays and cyclic error wrappers', () => {
    expect(getErrorMessage({ errors: ['Telephone is required.'] })).toBe('Telephone is required.');

    const cyclic: { data?: unknown; message: string } = { message: 'Safe fallback message' };
    cyclic.data = cyclic;
    expect(getErrorMessage(cyclic)).toBe('Safe fallback message');
  });
});
