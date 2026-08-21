/**
 * Parcel stickers encode a tracking URL in their QR code, not the bare
 * tracking code, so any scanned value has to be normalized back to the bare
 * code before it's used to look up a parcel. Mirrors
 * `src/server/utils/scan-code.ts`. Uses plain string parsing rather than the
 * `URL` global, which isn't guaranteed to exist on Hermes without a polyfill.
 */
export function extractScannedCode(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  const pathOnly = withoutProtocol.split(/[?#]/)[0] ?? '';
  const segments = pathOnly.split('/').slice(1).filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return trimmed;

  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}
