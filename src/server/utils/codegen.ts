/**
 * Code generation utilities (no moment.js).
 * Formats:
 *  - Tracking code: FirstChar(MMM) + 7 digits (1-9) + 3 letters (A-Z) e.g., "O1234567ABC"
 *  - Booking code: FirstChar(branch) + FirstChar(MMM) + 7 digits (1-9) + 1 letter (A-Z) e.g., "KO1234567A"
 *
 * All functions are fully typed and dependency-free.
 */

function firstChar(value: string): string {
  const s = value.trim();
  return s.length > 0 ? s[0]!.toUpperCase() : '';
}

function monthAbbrev(d: Date): string {
  // Equivalent to moment().format("MMM") in English locale
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
}

function randomIndex(max: number): number {
  if (max <= 0) throw new Error('max must be > 0');
  // Prefer cryptographic randomness when available (Bun/Node/Web)
  const g = (globalThis as { crypto?: { getRandomValues?: (arr: Uint32Array) => void } }).crypto;
  if (g && typeof g.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    g.getRandomValues(buf);
    // Using modulo for simplicity; bias is negligible for small alphabets and code generation
    return buf[0] !== undefined ? Number(buf[0] % max) : Math.floor(Math.random() * max);
  }
  // Fallback
  return Math.floor(Math.random() * max);
}

function pickChars(charset: string, count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    const idx = randomIndex(charset.length);
    out += charset.substring(idx, idx + 1);
  }
  return out;
}

function getAlphabets(count: number): string {
  return pickChars('ABCDEFGHIJKLMNOPQRSTUVWXYZ', count);
}

function getUniqueDigits(count: number): string {
  // Digits 1-9 (no zero), as in the original
  return pickChars('123456789', count);
}

/**
 * Tracking code format:
 *  FirstChar(MMM) + 7 digits (1-9) + 3 letters (A-Z)
 *  Example (October): "O1234567ABC"
 */
export function generateTrackingCode(at: Date = new Date()): string {
  const m = firstChar(monthAbbrev(at));
  return m + getUniqueDigits(7) + getAlphabets(3);
}

/**
 * Booking code format:
 *  FirstChar(branch) + FirstChar(MMM) + 7 digits (1-9) + 1 letter (A-Z)
 *  Example (branch "Kumasi", October): "KO1234567A"
 */
export function generateBookingCode(branch: string, at: Date = new Date()): string {
  const b = firstChar(branch);
  const m = firstChar(monthAbbrev(at));
  // Fallback if branch provided is empty/whitespace
  const branchInitial = b || 'X';
  return branchInitial + m + getUniqueDigits(7) + getAlphabets(1);
}
