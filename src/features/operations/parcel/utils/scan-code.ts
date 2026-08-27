/**
 * Parcel stickers encode either a tracking URL (see
 * `parcel-receipt-actions.tsx`'s `qrUrl`) or the legacy `QR-<code>` payload,
 * so any scanned value has to be normalized back to the bare code before it's
 * used to look up a parcel. Mirrors `src/server/utils/scan-code.ts`.
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
