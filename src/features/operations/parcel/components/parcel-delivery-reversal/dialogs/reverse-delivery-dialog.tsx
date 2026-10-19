import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export function ReverseDeliveryDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  isSaving: boolean;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reverse delivery confirmation</DialogTitle>
          <DialogDescription>
            This unconfirms delivery. Office parcels return to Awaiting Pickup; home parcels return
            to the rider handover stage. Payments remain recorded. Enter the reason.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          aria-label="Reason for reversal"
          value={props.reason}
          maxLength={500}
          onChange={(event) => props.onReasonChange(event.target.value)}
          placeholder="Reason for reversal"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={props.onConfirm}
            disabled={props.isSaving || props.reason.trim().length < 5}
          >
            {props.isSaving ? 'Reversing…' : 'Reverse Delivery'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
