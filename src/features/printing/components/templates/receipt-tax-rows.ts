import type { InvoiceA5TemplateProps } from './invoice-a5-template.types';

export function receiptTaxRows(tax: InvoiceA5TemplateProps['tax']) {
  const configuredKeys = new Set(
    (tax.taxComponentKeys ?? []).map((key) => key.replace(/[\s_-]+/g, '').toLowerCase()),
  );
  const aliases: Record<string, string[]> = {
    GETFUND: ['getfund', 'getfl', 'getfundlevy'],
    NHIL: ['nhil', 'nhillevy'],
    VAT: ['vat'],
    COVID: ['covid', 'covid19levy', 'covidlevy'],
  };
  return [
    { label: 'GETFUND', value: tax.getfund },
    { label: 'NHIL', value: tax.nhil },
    { label: 'VAT', value: tax.vat },
    { label: 'COVID', value: tax.covid ?? 0 },
  ].filter(
    (row) => row.value !== 0 || (aliases[row.label] ?? []).some((key) => configuredKeys.has(key)),
  );
}
