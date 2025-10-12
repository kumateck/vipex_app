import { describe, test, expect } from 'bun:test';
import { hashPassword, verifyPassword } from '../../src/server/utils/password';

describe('password hashing', () => {
  test('hash and verify', async () => {
    const hash = await hashPassword('StrongPass123!');
    expect(hash).toBeTruthy();
    const ok = await verifyPassword('StrongPass123!', hash);
    expect(ok).toBe(true);

    const bad = await verifyPassword('WrongPass', hash);
    expect(bad).toBe(false);
  });
});
