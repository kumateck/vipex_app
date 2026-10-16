import { lazy, Suspense } from 'react';
import { useParcelDetailsViewer } from '../../hooks/use-parcel-details-viewer';

const ParcelDetailsDialog = lazy(() =>
  import('./parcel-details-dialog').then((module) => ({ default: module.ParcelDetailsDialog })),
);

/** Mounted once in the app layout; loads the dialog code the first time a parcel is opened. */
export function ParcelDetailsHost() {
  const parcelId = useParcelDetailsViewer((state) => state.parcelId);
  const close = useParcelDetailsViewer((state) => state.close);
  if (!parcelId) return null;
  return (
    <Suspense fallback={null}>
      <ParcelDetailsDialog parcelId={parcelId} onClose={close} />
    </Suspense>
  );
}
