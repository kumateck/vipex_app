import type { ParcelStorageClearanceRow } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatStorageClearanceStatus, formatStorageMoney } from '../utils';

type Props = {
  rows: ParcelStorageClearanceRow[];
  loading: boolean;
  canApprove?: boolean;
  canExecute?: boolean;
  onSelect?: (row: ParcelStorageClearanceRow) => void;
  onApprove?: (row: ParcelStorageClearanceRow) => void;
  onReject?: (row: ParcelStorageClearanceRow) => void;
  onReturn?: (row: ParcelStorageClearanceRow) => void;
  onExecute?: (row: ParcelStorageClearanceRow) => void;
  requesterId?: string;
  onResubmit?: (row: ParcelStorageClearanceRow) => void;
};

export function ParcelStorageClearanceTable({
  rows,
  loading,
  canApprove,
  canExecute,
  onSelect,
  onApprove,
  onReject,
  onReturn,
  onExecute,
  onResubmit,
  requesterId,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-3">Parcel</th>
            <th className="p-3">Requested / Accrued Days</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Reason</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="p-3">
                <button
                  type="button"
                  className="text-left font-medium underline-offset-2 hover:underline"
                  onClick={() => onSelect?.(row)}
                >
                  {row.bookingCode}
                </button>
                <p className="text-xs text-muted-foreground">{row.trackingCode}</p>
              </td>
              <td className="p-3">
                {row.executedDays ?? row.requestedDays} / {row.accruedDaysAtRequest}
              </td>
              <td className="p-3">
                {formatStorageMoney(row.executedAmountPsw ?? row.requestedAmountPsw)}
              </td>
              <td className="max-w-xs p-3">{row.reason}</td>
              <td className="p-3">
                <Badge variant={row.status === 3 ? 'destructive' : 'outline'}>
                  {formatStorageClearanceStatus(row.status)}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  {canApprove && row.status === 0 ? (
                    <>
                      <Button size="sm" onClick={() => onApprove?.(row)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onReject?.(row)}>
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {canExecute && row.status === 1 ? (
                    <>
                      <Button size="sm" onClick={() => onExecute?.(row)}>
                        Execute
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onReturn?.(row)}>
                        Return for Review
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onReject?.(row)}>
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {row.status === 2 && onResubmit && row.requestedBy === requesterId ? (
                    <Button size="sm" onClick={() => onResubmit(row)}>
                      Review & Resubmit
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                {loading ? 'Loading storage clearances…' : 'No storage clearance requests found.'}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
