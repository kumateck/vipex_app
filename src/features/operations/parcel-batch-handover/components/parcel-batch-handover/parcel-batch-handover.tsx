import { lazy, Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { BatchHandoverWorkflow } from '@/shared/shipments/parcel-batch-handover';

const HandoverDialog = lazy(() =>
  import('../../dialogs').then(({ ParcelBatchHandoverDialog }) => ({
    default: ParcelBatchHandoverDialog,
  })),
);

export function ParcelBatchHandover({ workflow }: { workflow: BatchHandoverWorkflow }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Hand over multiple parcels</Button>
      </DialogTrigger>
      {open ? (
        <Suspense
          fallback={
            <DialogContent aria-describedby={undefined}>
              <DialogTitle>Loading handover…</DialogTitle>
            </DialogContent>
          }
        >
          <HandoverDialog workflow={workflow} onClose={() => setOpen(false)} />
        </Suspense>
      ) : null}
    </Dialog>
  );
}
