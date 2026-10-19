import { describe, expect, test } from 'bun:test';
import { getSelfServiceSessionScreen } from './self-service-session-screen';

const ready = {
  branchId: 'branch-a',
  status: 'ready',
  serverExpired: false,
  fetchingBranch: false,
  hasBranch: true,
  branchError: false,
};

describe('session recovery screen decisions', () => {
  test('shows a valid server-confirmed session', () => {
    expect(getSelfServiceSessionScreen(ready)).toBeNull();
  });
  test('does not reuse a cached 410 while creating a replacement session', () => {
    expect(
      getSelfServiceSessionScreen({
        ...ready,
        status: 'starting',
        hasBranch: false,
        branchError: true,
      }),
    ).toBe('loading');
    expect(
      getSelfServiceSessionScreen({
        ...ready,
        fetchingBranch: true,
        hasBranch: false,
        branchError: true,
      }),
    ).toBe('loading');
  });
  test('offers recovery when the server rejects a session', () => {
    expect(getSelfServiceSessionScreen({ ...ready, serverExpired: true })).toBe('expired');
    expect(getSelfServiceSessionScreen({ ...ready, status: 'expired', hasBranch: false })).toBe(
      'expired',
    );
  });
  test('requires rescan when the ten-booking limit is reached', () => {
    expect(getSelfServiceSessionScreen({ ...ready, status: 'limit', hasBranch: false })).toBe(
      'limit',
    );
  });
  test('retains creation errors and invalid-branch handling', () => {
    expect(getSelfServiceSessionScreen({ ...ready, status: 'error', hasBranch: false })).toBe(
      'error',
    );
    expect(getSelfServiceSessionScreen({ ...ready, branchId: '' })).toBe('invalid');
    expect(getSelfServiceSessionScreen({ ...ready, hasBranch: false })).toBe('invalid');
  });
});
