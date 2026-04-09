import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { BranchOption } from '@/features/branches/api/branches.api';
import type { LocationOption } from '@/features/locations/api/locations.api';
import type { RoleOption } from '@/features/rbac/api/rbac.api';
import type { Employee } from '../../api/hr.api';

type EmployeesLinkUserDialogProps = {
  open: boolean;
  employee: Employee | null;
  roleOptions: RoleOption[];
  branchOptions: BranchOption[];
  locationOptions: LocationOption[];
  userRoleId: string;
  userBranchId: string;
  userLocationId: string;
  onUserRoleIdChange: (value: string) => void;
  onUserBranchIdChange: (value: string) => void;
  onUserLocationIdChange: (value: string) => void;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
};

export function EmployeesLinkUserDialog({
  open,
  employee,
  roleOptions,
  branchOptions,
  locationOptions,
  userRoleId,
  userBranchId,
  userLocationId,
  onUserRoleIdChange,
  onUserBranchIdChange,
  onUserLocationIdChange,
  isSubmitting,
  onOpenChange,
  onClose,
  onSubmit,
}: EmployeesLinkUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user from employee</DialogTitle>
          <DialogDescription>
            Provision login access for {employee?.displayName ?? 'this employee'}.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Role</FieldLabel>
            <Select value={userRoleId} onValueChange={onUserRoleIdChange}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Branch</FieldLabel>
            <Select value={userBranchId} onValueChange={onUserBranchIdChange}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Location</FieldLabel>
            <Select value={userLocationId} onValueChange={onUserLocationIdChange}>
              <SelectTrigger disabled={!userBranchId}>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {locationOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!employee || !userRoleId || !userBranchId || isSubmitting}
            onClick={onSubmit}
          >
            Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
