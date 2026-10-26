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
          Update credit charge
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update credit charge</DialogTitle>
          <DialogDescription>
            {props.bookingCode}: Only unpaid credit charges can be changed. The customer balance
            updates with the charge.
          </DialogDescription>
        </DialogHeader>
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
            {model.isLoading ? 'Saving…' : 'Update charge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
