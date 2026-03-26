export function formatMoneyPsw(amountPsw?: number | null, currencyCode = 'GHS') {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amountPsw ?? 0) / 100);
}

export function isoDate(value: Date | undefined) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function formatPercent(value: number | null | undefined) {
  return `${(Number(value ?? 0) * 100).toFixed(1)}%`;
}
