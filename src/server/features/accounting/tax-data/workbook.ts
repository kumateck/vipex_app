import { zipSync, strToU8 } from 'fflate';
import { TAX_EXPORT_COLUMNS, type TaxDataRow } from '@/shared/tax-data';
import { assertRecordedTaxBalances } from './rows';

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
function escapeXml(value: string) {
  return Array.from(value)
    .filter((char) => char.charCodeAt(0) >= 32 || ['\t', '\n', '\r'].includes(char))
    .join('')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
function columnName(index: number): string {
  return index < 26
    ? String.fromCharCode(65 + index)
    : `${columnName(Math.floor(index / 26) - 1)}${columnName(index % 26)}`;
}
function textCell(ref: string, value: string) {
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}
export function buildTaxDataWorkbook(rows: TaxDataRow[]) {
  rows.forEach(assertRecordedTaxBalances);
  const header = `<row r="1">${TAX_EXPORT_COLUMNS.map(([, label], i) => textCell(`${columnName(i)}1`, label)).join('')}</row>`;
  const body = rows
    .map(
      (row, i) =>
        `<row r="${i + 2}">${TAX_EXPORT_COLUMNS.map(([key, , kind], col) => {
          const ref = `${columnName(col)}${i + 2}`;
          const value = row[key];
          if (kind === 'money')
            return `<c r="${ref}" s="1"><v>${(Number(value) / 100).toFixed(2)}</v></c>`;
          if (kind === 'number') return `<c r="${ref}"><v>${Number(value)}</v></c>`;
          return textCell(ref, kind === 'boolean' ? (value ? 'Yes' : 'No') : String(value));
        }).join('')}</row>`,
    )
    .join('');
  const sheet = `${XML}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="${TAX_EXPORT_COLUMNS.length}" width="20" customWidth="1"/></cols><sheetData>${header}${body}</sheetData><autoFilter ref="A1:${columnName(TAX_EXPORT_COLUMNS.length - 1)}${rows.length + 1}"/></worksheet>`;
  const files = {
    '[Content_Types].xml': `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    '_rels/.rels': `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `${XML}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Parcel tax data" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': `${XML}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    'xl/worksheets/sheet1.xml': sheet,
  };
  return zipSync(
    Object.fromEntries(Object.entries(files).map(([path, xml]) => [path, strToU8(xml)])),
  );
}
