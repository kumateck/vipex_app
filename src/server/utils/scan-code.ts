/**
 * Parcel stickers encode a tracking URL in their QR code (see
 * `parcel-receipt-actions.tsx`'s `qrUrl`), not the bare tracking code. Camera
 * scanners and USB barcode-scanner keyboards both return that raw string
 * as-is, so any code lookup has to normalize it back to the bare code first.
 * Uses plain string parsing (mirrored on the mobile side in
 * `apps/mobile/src/lib/scan-code.ts`) rather than the `URL` global, so the
 * same logic behaves identically on both runtimes.
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
