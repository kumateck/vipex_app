/**
 * Parcel stickers encode either a tracking URL (see
 * `parcel-receipt-actions.tsx`'s `qrUrl`) or the legacy `QR-<code>` payload.
 * Camera scanners and USB barcode-scanner keyboards both return that raw
 * string as-is, so any code lookup has to normalize it back to the bare code.
 * Uses plain string parsing (mirrored on the mobile side in
 * `apps/mobile/src/lib/scan-code.ts`) rather than the `URL` global, so the
 * same logic behaves identically on both runtimes.
 */
export function extractScannedCode(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return stripLegacyQrPrefix(trimmed);

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  const pathOnly = withoutProtocol.split(/[?#]/)[0] ?? '';
  const segments = pathOnly.split('/').slice(1).filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return trimmed;

  try {
    return stripLegacyQrPrefix(decodeURIComponent(last));
  } catch {
    return stripLegacyQrPrefix(last);
  }
}

function stripLegacyQrPrefix(value: string): string {
  return value.replace(/^QR-\s*/i, '').trim();
}
