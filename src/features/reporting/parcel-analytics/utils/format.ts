export const formatCount = (value: number) => value.toLocaleString('en-GH');
export const formatPercent = (value: number) => `${value.toFixed(1)}%`;
export const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(value / 100);
export const formatDays = (value: number) => `${value.toFixed(1)} days`;

export function csvCell(value: string | number) {
  const text = String(value);
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
