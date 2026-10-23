import { describe, expect, test } from 'bun:test';
import { unzipSync, strFromU8 } from 'fflate';
import { TAX_EXPORT_COLUMNS } from '@/shared/tax-data';
import { buildTaxDataWorkbook } from './workbook';
import { normalizeTaxDataRow } from './rows';
const row = normalizeTaxDataRow({
  parcelId: 'parcel',
  bookingCode: '=BAD()',
  trackingCode: 'TRACK',
  bookedOn: '2026-10-22',
  senderName: 'A & <B>',
  senderTelephone: '0240000001',
  receiverName: 'Receiver',
  receiverTelephone: '0240000002',
  sourceBranchName: 'Accra',
  destinationBranchName: 'Kumasi',
  parcelDetails: 'Box',
  parcelContent: 'Books',
  parcelValuePsw: 20000,
  paymentCount: 1,
  paymentIds: 'a',
  confirmed: false,
  paidPrincipalPsw: 12000,
  netPsw: 10000,
  vatPsw: 1500,
  getfundPsw: 250,
  nhilPsw: 250,
  covidPsw: 0,
  taxTotalPsw: 2000,
});
describe('tax data Excel workbook', () => {
  test('creates a valid XLSX package with exact header/value alignment and formatted currency cells', () => {
    const files = unzipSync(buildTaxDataWorkbook([row]));
    expect(files['[Content_Types].xml']).toBeDefined();
    expect(files['xl/workbook.xml']).toBeDefined();
    const sheet = strFromU8(files['xl/worksheets/sheet1.xml']!);
    const records = [...sheet.matchAll(/<row[^>]*>(.*?)<\/row>/g)].map(
      (match) => [...match[1]!.matchAll(/<c /g)].length,
    );
    expect(records).toEqual([TAX_EXPORT_COLUMNS.length, TAX_EXPORT_COLUMNS.length]);
    for (const label of [
      'GETFund GHS',
      'NHIL GHS',
      'COVID GHS',
      'VAT GHS',
      'Other tax GHS',
      'Total tax GHS',
    ])
      expect(sheet).toContain(label);
    expect(sheet).toContain('<v>120.00</v>');
    expect(sheet).toContain('state="frozen"');
  });
  test('keeps leading-zero phones and formula-like text as strings and escapes XML', () => {
    const sheet = strFromU8(unzipSync(buildTaxDataWorkbook([row]))['xl/worksheets/sheet1.xml']!);
    expect(sheet).toContain('0240000001');
    expect(sheet).toContain('A &amp; &lt;B&gt;');
    expect(sheet).toContain('=BAD()');
    expect(sheet).not.toContain('<f>');
  });
});
