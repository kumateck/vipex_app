import { describe, expect, test } from 'bun:test';
import {
  normalizeTaxDataAmounts,
  normalizeTaxDataRow,
  summarizeTaxDataCounts,
  assertRecordedTaxBalances,
} from './rows';
export const rawTaxRow = {
  parcelId: 'parcel',
  bookingCode: 'BOOK',
  trackingCode: 'TRACK',
  bookedOn: '2026-10-22',
  sourceBranchName: 'Accra',
  destinationBranchName: 'Kumasi',
  senderName: 'Sender',
  senderTelephone: '0240000001',
  receiverName: 'Receiver',
  receiverTelephone: '0240000002',
  parcelDetails: 'Box',
  parcelContent: 'Books',
  parcelValuePsw: '20000',
  paymentCount: 2,
  paymentIds: 'a,b',
  confirmed: false,
  paidPrincipalPsw: '15000',
  netPsw: '12200',
  vatPsw: '2000',
  getfundPsw: '300',
  nhilPsw: '300',
  covidPsw: '0',
  taxTotalPsw: '2800',
};
describe('recorded tax data', () => {
  test('preserves recorded rates and represents custom tax without recomputing', () => {
    const row = normalizeTaxDataRow(rawTaxRow);
    expect(row.otherTaxPsw).toBe(200);
    expect(row.paidPrincipalPsw).toBe(15000);
    expect(() => assertRecordedTaxBalances(row)).not.toThrow();
    expect(row).not.toHaveProperty('paymentIds');
  });
  test('snapshot changes with payment membership, amounts and export metadata, but not confirmation alone', () => {
    const base = normalizeTaxDataRow(rawTaxRow);
    expect(normalizeTaxDataRow({ ...rawTaxRow, confirmed: true }).version).toBe(base.version);
    for (const patch of [
      { paymentIds: 'a,c' },
      { netPsw: '12000' },
      { senderName: 'Corrected sender' },
    ])
      expect(normalizeTaxDataRow({ ...rawTaxRow, ...patch }).version).not.toBe(base.version);
  });
  test('rejects unbalanced, unsafe, or negative recorded tax amounts', () => {
    const row = normalizeTaxDataRow(rawTaxRow);
    for (const patch of [
      { netPsw: 1 },
      { paidPrincipalPsw: 1.5 },
      { taxTotalPsw: -1 },
      { otherTaxPsw: -1 },
    ])
      expect(() => assertRecordedTaxBalances({ ...row, ...patch })).toThrow('do not balance');
  });
  test('aggregates counts and custom tax amounts and handles an empty cohort', () => {
    const filters = { date: '2026-10-22', confirmation: 'all' as const };
    const report = summarizeTaxDataCounts([{ ...rawTaxRow, parcels: 3, amountPsw: 5000 }], filters);
    expect(report.totals.otherTaxPsw).toBe(200);
    expect(report.totals.parcels).toBe(3);
    expect(summarizeTaxDataCounts([], filters).totals.parcels).toBe(0);
    expect(normalizeTaxDataAmounts({}).taxTotalPsw).toBe(0);
  });
});
