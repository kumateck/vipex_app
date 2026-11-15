import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { BatchHandoverWorkflow } from '@/shared/shipments/parcel-batch-handover';
import { BatchParcelSelection, BatchVerification } from '../components/parcel-batch-handover';
import { useWebBatchHandover } from '../hooks/web';

export function ParcelBatchHandoverDialog({
  workflow,
  onClose,
}: {
  workflow: BatchHandoverWorkflow;
  onClose: () => void;
}) {
  const flow = useWebBatchHandover(workflow);
  const cashier = workflow === 'receiver-cashier';
  return (
    <DialogContent
      className="sm:max-w-2xl"
      showCloseButton={!flow.busy}
      onEscapeKeyDown={(event) => {
        if (flow.busy) event.preventDefault();
      }}
      onInteractOutside={(event) => event.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle>Hand over multiple parcels</DialogTitle>
        <DialogDescription>
          {cashier
            ? 'Collect the amount due and use one OTP and one signature for the receiver’s selected parcels.'
            : 'Find the receiver’s parcels and use one OTP and one signature for the selection.'}
        </DialogDescription>
      </DialogHeader>
      {flow.completedCount ? (
        <div className="space-y-3">
          <p role="status">{flow.completedCount} parcels marked as received.</p>
          <Button onClick={onClose}>Done</Button>
        </div>
      ) : flow.session ? (
        <BatchVerification
          key={flow.session.id}
          flow={flow}
          session={flow.session}
          allowTopaz={cashier}
        />
      ) : (
        <BatchParcelSelection flow={flow} />
      )}
      {flow.busy ? (
        <p role="status" className="text-sm text-muted-foreground">
          Working…
        </p>
      ) : null}
      {flow.error ? (
        <p role="alert" className="text-sm text-destructive">
          {flow.error}
        </p>
      ) : null}
    </DialogContent>
  );
}
