import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { parcelStatusLabel } from '@/shared/shipments/parcel-status-labels';
import type { ParcelAnalyticsStatus } from '../../types';
import { formatCount, formatDays, formatMoney, formatPercent } from '../../utils';

export const ParcelAnalyticsStatusTable = memo(function ParcelAnalyticsStatusTable({
  rows,
  onSelect,
}: {
  rows: ParcelAnalyticsStatus[];
  onSelect: (status: number) => void;
}) {
  return (
    <Table className="parcel-analytics-table">
      <caption className="sr-only">
        Parcel totals by current status. Select a parcel count to view matching parcels.
      </caption>
      <TableHeader>
        <TableRow>
          {[
            'Status',
            'Parcels',
            'Share',
            'Charges',
            'Receiver outstanding',
            'Average booking age',
            'Uncollected 7+ days',
          ].map((label) => (
            <TableHead key={label} className="whitespace-nowrap">
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.status}>
            <TableCell className="font-medium">{parcelStatusLabel(row.status)}</TableCell>
            <TableCell>
              <Button
                variant="link"
                className="h-auto p-0 tabular-nums"
                disabled={!row.parcels}
                aria-label={`View ${row.parcels} parcels: ${parcelStatusLabel(row.status)}`}
                onClick={() => onSelect(row.status)}
              >
                {formatCount(row.parcels)}
              </Button>
            </TableCell>
            <TableCell className="tabular-nums">{formatPercent(row.share)}</TableCell>
            <TableCell className="whitespace-nowrap tabular-nums">
              {formatMoney(row.chargePsw)}
            </TableCell>
            <TableCell className="whitespace-nowrap tabular-nums">
              {formatMoney(row.receiverOutstandingPsw)}
            </TableCell>
            <TableCell className="whitespace-nowrap tabular-nums">
              {row.parcels ? formatDays(row.averageAgeDays) : '—'}
            </TableCell>
            <TableCell className="tabular-nums">{formatCount(row.uncollected7Days)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});
