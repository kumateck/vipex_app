import type { ParcelStorageClearanceRow, ParcelStorageClearanceDetail } from '../types';
import { formatStorageMoney, storageClearanceLabel, formatStorageClearanceStatus } from '../utils';
export function StorageClearanceSummary({
  row,
  detail,
}: {
  row: ParcelStorageClearanceRow;
  detail?: ParcelStorageClearanceDetail;
}) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium">
        {storageClearanceLabel(row)} · {formatStorageClearanceStatus(row.status)}
      </p>
      <p>
        Requested: {row.requestedDays} days · {formatStorageMoney(row.requestedAmountPsw)}{' '}
        {row.clearAll ? '(Clear All)' : ''}
      </p>
      <p>
        Unpaid days at request: {row.accruedDaysAtRequest} · Rate:{' '}
        {formatStorageMoney(row.dailyRatePsw)} / day
      </p>
      {detail ? (
        <p>
          Current unpaid days: {detail.accruedDays} · Outstanding:{' '}
          {formatStorageMoney(detail.outstandingPsw)} · Balance days: {detail.remainingDays}
        </p>
      ) : null}
      <p>Reason: {row.reason}</p>
      {row.evidenceUrl ? (
        <p className="break-all">
          Evidence:{' '}
          {/^https?:\/\//i.test(row.evidenceUrl) ? (
            <a className="underline" href={row.evidenceUrl} target="_blank" rel="noreferrer">
              {row.evidenceUrl}
            </a>
          ) : (
            row.evidenceUrl
          )}
        </p>
      ) : null}
      <p>
        Requested by: {row.requestedByName ?? 'Staff'} ·{' '}
        {new Date(row.requestedAt).toLocaleString()}
      </p>
      {row.returnNote ? <p>Finance review reason: {row.returnNote}</p> : null}
      {row.approvalNote ? <p>Approval note: {row.approvalNote}</p> : null}
      {row.rejectionNote ? <p>Rejection reason: {row.rejectionNote}</p> : null}
      {row.executedAt ? (
        <p>
          Executed: {row.executedByName ?? 'Finance'} · {new Date(row.executedAt).toLocaleString()}{' '}
          · {formatStorageMoney(row.executedAmountPsw)}
        </p>
      ) : null}
      {row.accountingJournalEntryId ? (
        <p>Accounting journal: {row.accountingJournalEntryId}</p>
      ) : null}
    </div>
  );
}
