import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ParcelFullDetails } from '@/features/operations/parcel/api/parcel.api';
import { parcelStatusLabel } from '@/shared/shipments/parcel-status-labels';
import { useParcelDetailsView } from '../../hooks/use-parcel-details-view';
import { ParcelDetailsTabs } from '../parcel-details-tabs/parcel-details-tabs';
import { ParcelDeletedNotice } from './parcel-deleted-notice';

export type ParcelDetailsDialogProps = {
  parcelId: string | null;
  onClose: () => void;
  /** Page-specific controls shown above the tabs (e.g. Return to Source). */
  renderBanner?: (details: ParcelFullDetails) => ReactNode;
  /** Page-specific actions shown in an extra "Actions" tab. */
  renderActions?: (details: ParcelFullDetails) => ReactNode;
};

/** The one parcel details view: every field and the full history, in tabs, at landscape width. */
export function ParcelDetailsDialog({
  parcelId,
  onClose,
  renderBanner,
  renderActions,
}: ParcelDetailsDialogProps) {
  const view = useParcelDetailsView(parcelId);
  const { details } = view;

  return (
    <Dialog open={Boolean(parcelId)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-h-[92vh] w-[96vw] overflow-y-auto sm:max-w-[min(1280px,96vw)]">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Parcel {details?.parcel.bookingCode ?? ''}
            {details ? (
              <Badge variant="secondary">{parcelStatusLabel(details.parcel.status)}</Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {details ? `Tracking ${details.parcel.trackingCode}` : 'Loading parcel details...'}
          </DialogDescription>
        </DialogHeader>

        {view.isError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
            Parcel details could not be loaded.
            <Button variant="outline" size="sm" onClick={() => void view.retry()}>
              Try again
            </Button>
          </div>
        ) : null}
        {view.isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading details...</div>
        ) : null}
        {details ? (
          <div className="space-y-4">
            <ParcelDeletedNotice details={details} history={view.history} />
            {renderBanner?.(details)}
            <ParcelDetailsTabs
              key={details.parcel.id}
              details={details}
              branchNameById={view.branchNameById}
              history={{
                events: view.history,
                isLoading: view.isHistoryLoading,
                isError: view.isHistoryError,
              }}
              actions={renderActions?.(details)}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
