import type { ParcelAnalyticsReport } from '../types';
import { parcelStatusLabel } from '@/shared/shipments/parcel-status-labels';
import { csvCell } from './format';

export function parcelAnalyticsCsv(report: ParcelAnalyticsReport) {
  const rows: Array<Array<string | number>> = [
    ['Parcel analytics', report.filters.from, report.filters.to],
    ['Branch basis', report.filters.basis, 'Branch', report.filters.branchId ?? 'All branches'],
    [
      'Origin',
      report.filters.sourceId ?? 'All',
      'Destination',
      report.filters.destinationId ?? 'All',
    ],
    [
      'Status filter',
      report.filters.status === undefined ? 'All' : parcelStatusLabel(report.filters.status),
    ],
    ['Generated at', report.generatedAt],
    [
      'Status',
      'Parcels',
      'Share %',
      'Charges GHS',
      'Receiver outstanding GHS',
      'Average age days',
      'Uncollected 7+ days',
    ],
    ...report.statuses.map((row) => [
      parcelStatusLabel(row.status),
      row.parcels,
      row.share.toFixed(1),
      (row.chargePsw / 100).toFixed(2),
      (row.receiverOutstandingPsw / 100).toFixed(2),
      row.averageAgeDays.toFixed(1),
      row.uncollected7Days,
    ]),
    [],
    [
      'Branch',
      'Parcels',
      'Completion %',
      'Charges GHS',
      'Receiver outstanding GHS',
      ...report.statuses.map((row) => parcelStatusLabel(row.status)),
    ],
    ...report.branches.map((row) => [
      row.branchName,
      row.parcels,
      row.completionRate.toFixed(1),
      (row.chargePsw / 100).toFixed(2),
      (row.receiverOutstandingPsw / 100).toFixed(2),
      ...report.statuses.map((status) => row.statuses[status.status] ?? 0),
    ]),
    [],
    ['Booking day', 'Parcels'],
    ...report.trend.map((row) => [row.day, row.parcels]),
    [],
    ['Collection age since receipt', 'Parcels'],
    ...report.aging.map((row) => [row.label, row.parcels]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}
