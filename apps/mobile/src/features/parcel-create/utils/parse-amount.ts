export function parseAmount(raw: string): number | null {
  const normalized = raw.replace(/,/g, '').trim();
  if (!normalized) return 0;
  const value = Number(normalized);
  return Number.isNaN(value) || value < 0 ? null : value;
}
