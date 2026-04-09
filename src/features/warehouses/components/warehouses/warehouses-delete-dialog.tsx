import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type WarehousesDeleteDialogProps = {
  open: boolean;
  isDeleting: boolean;
  canDelete: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function WarehousesDeleteDialog({
  open,
  isDeleting,
  canDelete,
  onClose,
  onConfirm,
}: WarehousesDeleteDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete warehouse?</AlertDialogTitle>
          <AlertDialogDescription>
            This will only work when no parcel is currently held in the warehouse.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isDeleting || !canDelete} onClick={onConfirm}>
            {isDeleting ? 'Deleting...' : 'Delete Warehouse'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
