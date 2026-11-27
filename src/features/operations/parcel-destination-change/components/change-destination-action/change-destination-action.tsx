import { memo, Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import { ChangeDestinationDialog } from '../../dialogs';
import type { DestinationChangeParcel } from '../../types';

/** Super Search action: shown only to users with CanChangeParcelDestination on live parcels. */
export const ChangeDestinationAction = memo(function ChangeDestinationAction({
  parcel,
}: {
  parcel: DestinationChangeParcel;
}) {
  const allowed = useHasPermission(PermissionKeys.CanChangeParcelDestination);
  const [open, setOpen] = useState(false);
  if (!allowed || parcel.isDeleted) return null;

  return (
    <div className="space-y-2 rounded-md border p-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Change Destination
      </Button>
      {open ? (
        <Suspense fallback={null}>
          <ChangeDestinationDialog parcel={parcel} open={open} onClose={() => setOpen(false)} />
        </Suspense>
      ) : null}
    </div>
  );
});
