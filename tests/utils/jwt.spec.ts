import { describe, test, expect } from 'bun:test';

describe('jwt sign/verify', async () => {
  // Dynamic import after setup to ensure env is loaded first
  const jwt = await import('../../src/server/utils/jwt');

  test('sign and verify access token', async () => {
    const payload = {
      sub: '00000000-0000-0000-0000-000000000001',
    };

    const token = await jwt.signAccessToken(payload);
    expect(typeof token).toBe('string');

    const decoded = await jwt.verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.exp).toBeGreaterThan(decoded.iat!);
  });
});
