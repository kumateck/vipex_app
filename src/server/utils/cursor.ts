// Base64URL helpers without Node's Buffer to be runtime-safe on Bun v1.3
// Keyset pagination cursor encode/decode

export type Cursor<T> = T;

// Convert UTF-8 string <-> Uint8Array
// function utf8Encode(s: string): Uint8Array {
//   return new TextEncoder().encode(s);
// }
// function utf8Decode(bytes: Uint8Array): string {
//   return new TextDecoder().decode(bytes);
// }

// Standard base64 using btoa/atob, which operate on Latin1. We bridge via percent-encoding.
function base64Encode(str: string): string {
  // encodeURIComponent -> percent bytes -> Latin1
  const latin1 = decodeURIComponent(encodeURIComponent(str));
  return btoa(latin1);
}
function base64Decode(b64: string): string {
  const latin1 = atob(b64);
  // Latin1 -> percent bytes -> UTF-8
  return decodeURIComponent(
    latin1
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  );
}

// RFC 4648 base64url variant (no padding)
function toBase64Url(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function fromBase64Url(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  // pad to multiple of 4
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);
  return b64;
}

export type CursorKey = { createdAt: string; id: string };

export function encodeCursor<T extends object>(obj: T): string {
  const json = JSON.stringify(obj);
  const b64 = base64Encode(json);
  return toBase64Url(b64);
}

export function decodeCursor<T = unknown>(cursor?: string | null): T | null {
  if (!cursor) return null;
  try {
    const b64 = fromBase64Url(cursor);
    const json = base64Decode(b64);
    // JSON.parse returns any; cast through unknown to satisfy strict lint rules
    return JSON.parse(json) as unknown as T;
  } catch {
    return null;
  }
}
