import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useParcelDetailsViewer } from '../../hooks/use-parcel-details-viewer';

type ViewParcelDetailsActionProps = { parcelId: string; label?: string };

/** Drop-in menu item that opens the shared parcel details dialog. */
export function ViewParcelDetailsMenuItem({
  parcelId,
  label = 'View Details',
}: ViewParcelDetailsActionProps) {
  const open = useParcelDetailsViewer((state) => state.open);
  return <DropdownMenuItem onClick={() => open(parcelId)}>{label}</DropdownMenuItem>;
}

/** Drop-in button for tables without an action menu. */
export function ViewParcelDetailsButton({
  parcelId,
  label = 'Details',
}: ViewParcelDetailsActionProps) {
  const open = useParcelDetailsViewer((state) => state.open);
  return (
    <Button type="button" size="sm" variant="outline" onClick={() => open(parcelId)}>
      <Eye className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );
}
