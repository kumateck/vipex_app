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
import type { ParcelAnalyticsReport } from '../../types';
import { formatCount, formatMoney, formatPercent } from '../../utils';

export const ParcelAnalyticsBranches = memo(function ParcelAnalyticsBranches({
  report,
  onSelect,
}: {
  report: ParcelAnalyticsReport;
  onSelect: (branchId: string, status?: number) => void;
}) {
  return (
    <Table className="parcel-analytics-table">
      <caption className="sr-only">
        Branch comparison with current status counts. Scroll horizontally to see every status.
      </caption>
      <TableHeader>
        <TableRow>
          {[
            'Branch',
            'Total',
            'Completion',
            'Charges',
            'Receiver outstanding',
            'Uncollected 7+ days',
            ...report.statuses.map((row) => parcelStatusLabel(row.status)),
          ].map((label) => (
            <TableHead key={label} className="whitespace-nowrap">
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {report.branches.map((row) => (
          <TableRow key={row.branchId}>
            <TableCell className="whitespace-nowrap font-medium">{row.branchName}</TableCell>
            <TableCell>
              <Button
                variant="link"
                className="h-auto p-0 tabular-nums"
                onClick={() => onSelect(row.branchId)}
                aria-label={`View ${row.branchName} parcels`}
              >
                {formatCount(row.parcels)}
              </Button>
            </TableCell>
            <TableCell className="tabular-nums">{formatPercent(row.completionRate)}</TableCell>
            <TableCell className="whitespace-nowrap tabular-nums">
              {formatMoney(row.chargePsw)}
            </TableCell>
            <TableCell className="whitespace-nowrap tabular-nums">
              {formatMoney(row.receiverOutstandingPsw)}
            </TableCell>
            <TableCell className="tabular-nums">{formatCount(row.uncollected7Days)}</TableCell>
            {report.statuses.map(({ status }) => (
              <TableCell key={status}>
                <Button
                  variant="link"
                  className="h-auto p-0 tabular-nums"
                  disabled={!row.statuses[status]}
                  aria-label={`View ${parcelStatusLabel(status)} parcels for ${row.branchName}`}
                  onClick={() => onSelect(row.branchId, status)}
                >
                  {formatCount(row.statuses[status] ?? 0)}
                </Button>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});
