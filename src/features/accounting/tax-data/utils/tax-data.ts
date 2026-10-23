import { TAX_AMOUNT_COLUMNS } from '@/shared/tax-data';
import type { TaxDataAmounts, TaxDataRow } from '../types';
const currency = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  minimumFractionDigits: 2,
});
export const taxDataMoney = (psw: number) => currency.format(psw / 100);
export function parseTaxDataAmount(value: string): number | undefined | null {
  if (!value.trim()) return undefined;
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null;
  const psw = Math.round(Number(value) * 100);
  return Number.isSafeInteger(psw) && psw > 0 ? psw : null;
}
export function parseTaxDataOccurrences(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const count = Number(value);
  return Number.isInteger(count) && count >= 1 && count <= 500 ? count : null;
}
export function mergeTaxDataSelection(existing: TaxDataRow[], incoming: TaxDataRow[]) {
  const next = [...new Map([...existing, ...incoming].map((row) => [row.parcelId, row])).values()];
  if (next.length > 500)
    throw new Error(
      'The export list supports up to 500 parcels. Export or remove records before adding more.',
    );
  return next;
}
export function sumTaxDataRows(rows: TaxDataRow[]): TaxDataAmounts {
  return Object.fromEntries(
    TAX_AMOUNT_COLUMNS.map(([key]) => [key, rows.reduce((sum, row) => sum + row[key], 0)]),
  ) as TaxDataAmounts;
}
