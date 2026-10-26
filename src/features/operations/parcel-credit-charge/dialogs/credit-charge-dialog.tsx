import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreditCharge } from '../hooks';
import type { CreditChargeProps } from '../types';

export function CreditChargeDialog(props: CreditChargeProps) {
  const model = useCreditCharge(props);
  return (
    <Dialog open={model.open} onOpenChange={model.onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          Request charge correction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request charge correction</DialogTitle>
          <DialogDescription>
            {props.bookingCode}: Correct a zero charge to CREDIT. The charge and customer debt
            change only after an authorized staff member approves.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          Credit account: <strong>{props.senderName || 'Parcel sender'}</strong>
        </p>
        {model.pendingRequest ? (
          <p role="status" className="text-sm">
            A correction is already awaiting approval.
          </p>
        ) : null}
        {model.history.isError ? (
          <div role="alert">
            <p>Could not check pending requests.</p>
            <Button variant="outline" onClick={() => void model.history.refetch()}>
              Retry
            </Button>
          </div>
        ) : null}
        <fieldset disabled={model.isLoading} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credit-charge-amount">New charge (GHS)</Label>
            <Input
              id="credit-charge-amount"
              inputMode="decimal"
              value={model.amount}
              onChange={(e) => model.setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credit-charge-reason">Reason for change</Label>
            <Input
              id="credit-charge-reason"
              maxLength={500}
              value={model.reason}
              onChange={(e) => model.setReason(e.target.value)}
            />
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="credit-charge-confirm"
              checked={model.creditConfirmed}
              onCheckedChange={(value) => model.setCreditConfirmed(value === true)}
            />
            <Label htmlFor="credit-charge-confirm" className="leading-relaxed">
              Record this charge as CREDIT owed by the parcel sender.
            </Label>
          </div>
        </fieldset>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={model.isLoading}
            onClick={() => model.onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!model.valid || model.isLoading}
            onClick={() => void model.submit()}
          >
            {model.isLoading ? 'Saving…' : 'Submit for approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
