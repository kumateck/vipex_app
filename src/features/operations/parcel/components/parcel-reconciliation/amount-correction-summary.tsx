import type { ParcelReconciliationCaseRow } from '../../api/parcel.api';
import { formatMoneyPsw, formatReconciliationDate } from './utils';

type AmountCorrectionSummaryProps = {
  reconciliationCase: ParcelReconciliationCaseRow;
};

export function AmountCorrectionSummary({ reconciliationCase }: AmountCorrectionSummaryProps) {
  return (
    <div className="space-y-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
      <div>
        <p className="text-sm font-medium">Correction impact</p>
        <p className="text-xs text-muted-foreground">
          Sales totals will be recalculated in this original shift. The approval and execution
          remain dated when they actually occur in the audit trail.
        </p>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Total charge</dt>
          <dd>
            {formatMoneyPsw(reconciliationCase.originalChargePsw)} →{' '}
            <strong>{formatMoneyPsw(reconciliationCase.proposedChargePsw)}</strong>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Receiver to-be-paid</dt>
          <dd>
            {formatMoneyPsw(reconciliationCase.originalPlannedToBePaidPsw)} →{' '}
            <strong>{formatMoneyPsw(reconciliationCase.proposedPlannedToBePaidPsw)}</strong>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Original cashier</dt>
          <dd>{reconciliationCase.sessionCashierName ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Transaction effective time</dt>
          <dd>
            {formatReconciliationDate(
              reconciliationCase.effectiveAt ?? reconciliationCase.sessionScheduledStartTime,
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
