import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { useTaxData, useTaxDataActions } from '../hooks';
import { taxDataMoney } from '../utils';

export function TaxDataConfirmDialog({
  data,
  actions,
}: {
  data: ReturnType<typeof useTaxData>;
  actions: ReturnType<typeof useTaxDataActions>;
}) {
  return (
    <Dialog
      open={actions.confirmOpen}
      onOpenChange={(open) => {
        if (!actions.confirming) actions.setConfirmOpen(open);
      }}
    >
      <DialogContent showCloseButton={!actions.confirming}>
        <DialogHeader>
          <DialogTitle>Confirm selected tax data?</DialogTitle>
          <DialogDescription>
            Mark {data.selection.rows.length} selected parcels as tax-confirmed. This records an
            audit entry. Tax filing status and accounting entries remain unchanged.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt>Principal paid</dt>
            <dd className="font-semibold tabular-nums">
              {taxDataMoney(data.selection.totals.paidPrincipalPsw)}
            </dd>
          </div>
          <div>
            <dt>Recorded tax</dt>
            <dd className="font-semibold tabular-nums">
              {taxDataMoney(data.selection.totals.taxTotalPsw)}
            </dd>
          </div>
        </dl>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={actions.confirming}
            onClick={() => actions.setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={!data.canConfirm || !data.selection.rows.length || actions.busy}
            onClick={() => void actions.confirm()}
          >
            {actions.confirming ? 'Confirming…' : 'Confirm tax data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
