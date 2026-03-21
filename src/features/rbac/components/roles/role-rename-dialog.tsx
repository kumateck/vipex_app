import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface RoleRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleName: string;
  onRoleNameChange: (value: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}

export function RoleRenameDialog({
  open,
  onOpenChange,
  roleName,
  onRoleNameChange,
  submitting,
  onSubmit,
}: RoleRenameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename role</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Role name"
          value={roleName}
          onChange={(event) => onRoleNameChange(event.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
