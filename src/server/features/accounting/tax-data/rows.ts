import { createHash } from 'node:crypto';
import type { TaxDataRow, TaxDataAmounts, TaxDataCounts, TaxDataFilters } from '@/shared/tax-data';
import { TAX_AMOUNT_COLUMNS } from '@/shared/tax-data';
import { Conflict } from '@/server/utils/http-error';

export function normalizeTaxDataAmounts(raw: Record<string, unknown>): TaxDataAmounts {
  const amounts = Object.fromEntries(
    TAX_AMOUNT_COLUMNS.map(([key]) => [key, Number(raw[key] ?? 0)]),
  ) as TaxDataAmounts;
  amounts.otherTaxPsw =
    amounts.taxTotalPsw - amounts.vatPsw - amounts.getfundPsw - amounts.nhilPsw - amounts.covidPsw;
  return amounts;
}
export function normalizeTaxDataRow(raw: Record<string, unknown>): TaxDataRow {
  const row = {
    ...raw,
    paymentIds: String(raw.paymentIds ?? ''),
    ...normalizeTaxDataAmounts(raw),
    parcelValuePsw: Number(raw.parcelValuePsw),
    paymentCount: Number(raw.paymentCount),
    confirmed: Boolean(raw.confirmed),
  };
  const { confirmed: _confirmed, ...snapshot } = row;
  const version = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
  const { paymentIds: _paymentIds, ...visible } = row;
  return { ...visible, version } as TaxDataRow;
}
export function summarizeTaxDataCounts(
  raw: Record<string, unknown>[],
  filters: TaxDataFilters,
): TaxDataCounts {
  const totals = { ...normalizeTaxDataAmounts({}), parcels: 0 };
  for (const row of raw) {
    totals.parcels += Number(row.parcels);
    const amounts = normalizeTaxDataAmounts(row);
    for (const [key] of TAX_AMOUNT_COLUMNS) totals[key] += amounts[key];
  }
  return {
    filters,
    generatedAt: new Date().toISOString(),
    totals,
    groups: raw.map((row) => ({ amountPsw: Number(row.amountPsw), parcels: Number(row.parcels) })),
  };
}
export function assertRecordedTaxBalances(row: TaxDataRow) {
  if (
    TAX_AMOUNT_COLUMNS.some(([key]) => !Number.isSafeInteger(row[key])) ||
    row.netPsw < 0 ||
    row.taxTotalPsw < 0 ||
    row.paidPrincipalPsw !== row.netPsw + row.taxTotalPsw ||
    row.otherTaxPsw < 0
  )
    throw Conflict(
      'Recorded tax amounts do not balance. Review the payment records before exporting or confirming.',
    );
}
