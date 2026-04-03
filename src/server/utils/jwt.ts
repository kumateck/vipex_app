import { SignJWT, jwtVerify } from 'jose';
import { env } from '../utils/env';
import { parseDurationToSeconds } from './duration';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const accessExpSec = parseDurationToSeconds(env.JWT_ACCESS_EXPIRES);
const alg = 'HS256';

export type JwtPayload = {
  sub: string; // user id
};

export async function signAccessToken(payload: JwtPayload) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt(now)
    .setExpirationTime(now + accessExpSec)
    .sign(secret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret, { algorithms: [alg] });
  return payload as JwtPayload & { iat: number; exp: number };
}
