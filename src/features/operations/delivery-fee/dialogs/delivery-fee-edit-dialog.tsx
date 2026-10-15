import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { useDeliveryFeeEdit } from '../hooks';
import { formatDeliveryFee } from '../utils';

type Props = { bookingCode: string; editor: ReturnType<typeof useDeliveryFeeEdit> };
export function DeliveryFeeEditDialog({ bookingCode, editor }: Props) {
  return (
    <Dialog
      open={editor.open}
      onOpenChange={(open) => {
        if (!open) editor.close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Delivery Fee</DialogTitle>
          <DialogDescription>
            Update the agreed fee for {bookingCode}. This saves the charge; it does not record a
            payment.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void editor.save();
          }}
        >
          {editor.isFetching ? <p role="status">Loading current delivery fee...</p> : null}
          {editor.context ? (
            <>
              <p className="text-sm">
                Current fee: <strong>{formatDeliveryFee(editor.context.chargePsw)}</strong>
              </p>
              <p className="text-sm">
                Already paid: {formatDeliveryFee(editor.context.paidFeePsw)} · Rider recorded:{' '}
                {formatDeliveryFee(editor.context.riderCollectedFeePsw)}
              </p>
              <div className="space-y-2">
                <Label htmlFor={`fee-${editor.context.parcelId}`}>New Delivery Fee (GHS)</Label>
                <Input
                  id={`fee-${editor.context.parcelId}`}
                  inputMode="decimal"
                  value={editor.amount}
                  onChange={(event) => editor.setAmount(event.target.value)}
                  disabled={editor.isSaving || editor.isFetching}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`reason-${editor.context.parcelId}`}>Reason</Label>
                <Textarea
                  id={`reason-${editor.context.parcelId}`}
                  value={editor.reason}
                  maxLength={500}
                  onChange={(event) => editor.setReason(event.target.value)}
                  disabled={editor.isSaving || editor.isFetching}
                  placeholder="Explain the correction or confirmed fee"
                />
              </div>
            </>
          ) : null}
          {editor.error ? (
            <p role="alert" className="text-sm text-destructive">
              {editor.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={editor.close}
              disabled={editor.isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void editor.reload()}
              disabled={editor.isSaving || editor.isFetching}
            >
              Reload Fee
            </Button>
            <Button
              type="submit"
              disabled={!editor.context || editor.isFetching || editor.isSaving}
            >
              {editor.isSaving ? 'Saving...' : 'Save Delivery Fee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
