import { memo, useState } from 'react';
import { MessageSquareText, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { ParcelHandoverNoteDialog } from '../../dialogs';
import type { ParcelHandoverNoteIndicator } from '../../types';

export const ParcelHandoverNoteAction = memo(function ParcelHandoverNoteAction({
  parcelId,
  hasHandoverNote,
  handoverNoteCritical,
  allowEdit = false,
  onSaved,
}: ParcelHandoverNoteIndicator & {
  parcelId: string;
  allowEdit?: boolean;
  onSaved?: () => void;
}) {
  const canWrite = useAuthStore(
    (state) =>
      allowEdit &&
      state.user?.permissions?.includes(PermissionKeys.CanUpdateParcelHandoverNote) === true,
  );
  const [open, setOpen] = useState(false);
  if (!hasHandoverNote && !canWrite) return null;
  const Icon = handoverNoteCritical ? TriangleAlert : MessageSquareText;
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={handoverNoteCritical ? 'border-destructive/40 text-destructive' : undefined}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <Icon
          aria-hidden="true"
          className={handoverNoteCritical ? 'motion-safe:animate-pulse' : undefined}
        />
        {handoverNoteCritical
          ? 'Critical note'
          : hasHandoverNote
            ? 'Handover note'
            : 'Add handover note'}
      </Button>
      {open ? (
        <ParcelHandoverNoteDialog
          parcelId={parcelId}
          allowEdit={canWrite}
          adding={!hasHandoverNote}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            onSaved?.();
            toast.success('Handover note saved');
          }}
        />
      ) : null}
    </>
  );
});
