import { randomBytes } from 'node:crypto';

export function generateOtpCode(): string {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function sha256HexAsync(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashOtp(scope: string, otp: string): Promise<string> {
  return sha256HexAsync(`${scope}:${otp.trim()}`);
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
