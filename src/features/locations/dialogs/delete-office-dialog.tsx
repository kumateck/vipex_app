import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDeleteLocationOffice } from '../hooks';

export function DeleteOfficeDialog({
  locationId,
  officeId,
  officeName,
}: {
  locationId: string;
  officeId: string;
  officeName: string;
}) {
  const deletion = useDeleteLocationOffice(locationId, officeId);

  return (
    <AlertDialog open={deletion.open} onOpenChange={deletion.onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label={`Delete ${officeName}`}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="[overflow-wrap:anywhere]">
            Delete {officeName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the office. Only offices with no linked parcels can be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deletion.error ? (
          <p role="alert" className="text-sm text-destructive">
            {deletion.error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletion.isLoading}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={deletion.isLoading}
            onClick={() => void deletion.confirm()}
          >
            {deletion.isLoading ? 'Deleting…' : 'Delete office'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
