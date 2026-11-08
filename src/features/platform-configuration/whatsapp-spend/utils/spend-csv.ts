import type { WhatsAppSpendReport } from '../types';

export const SPEND_CSV_HEADERS = [
  'Section',
  'Item',
  'Messages',
  'Delivered',
  'Failed',
  'Billable',
  'Unconfirmed',
  'Price per message',
  'Amount',
];

/** Rows for the client bill export: per message type, per day, then the total. */
export function buildSpendCsvRows(report: WhatsAppSpendReport) {
  const counts = (row: WhatsAppSpendReport['totals']) => [
    row.messages,
    row.delivered,
    row.failed,
    row.billable,
    row.unconfirmed,
  ];
  const amount = (value: number) => value.toFixed(2);
  return [
    ...report.byEvent.map((row) => [
      'Message type',
      row.name,
      ...counts(row),
      row.rateVaries ? 'varies' : row.rate.toFixed(4),
      amount(row.amount),
    ]),
    ...report.daily.map((row) => ['Day', row.day, ...counts(row), '', amount(row.amount)]),
    [
      'Total',
      `${report.period.from} to ${report.period.to}`,
      ...counts(report.totals),
      '',
      amount(report.totals.amount),
    ],
  ];
}

export function spendCsvFilename(report: WhatsAppSpendReport) {
  return `whatsapp-spend-${report.period.from}-to-${report.period.to}.csv`;
}
