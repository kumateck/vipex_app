import type { BranchOption } from '@/features/branches/api/branches.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { Warehouse, WarehouseMutationInput } from '../../api/warehouses.api';

interface WarehouseFormCardProps {
  branchOptions: BranchOption[];
  canCreate?: boolean;
  canUpdate?: boolean;
  editing: Warehouse | null;
  form: WarehouseMutationInput;
  isCreating: boolean;
  isUpdating: boolean;
  onActiveChange: (active: boolean) => void;
  onBranchChange: (branchId: string) => void;
  onClear: () => void;
  onDescriptionChange: (description: string) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
}

export function WarehouseFormCard({
  branchOptions,
  canCreate,
  canUpdate,
  editing,
  form,
  isCreating,
  isUpdating,
  onActiveChange,
  onBranchChange,
  onClear,
  onDescriptionChange,
  onNameChange,
  onSave,
}: WarehouseFormCardProps) {
  const isDisabled = editing ? !canUpdate : !canCreate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? 'Edit Warehouse' : 'New Warehouse'}</CardTitle>
        <CardDescription>
          Warehouses are owned by a branch and can be used as parcel holding points.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Branch</Label>
          <Select
            value={form.branchId || undefined}
            onValueChange={onBranchChange}
            disabled={isDisabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branchOptions.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="warehouse-name">Name</Label>
          <Input
            id="warehouse-name"
            value={form.name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Main Receiving Store"
            disabled={isDisabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="warehouse-description">Description</Label>
          <Input
            id="warehouse-description"
            value={form.description ?? ''}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Optional note"
            disabled={isDisabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={String(form.active ?? true)}
            onValueChange={(value) => onActiveChange(value === 'true')}
            disabled={isDisabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canCreate || canUpdate ? (
          <div className="flex gap-2">
            <Button onClick={onSave} disabled={isCreating || isUpdating || isDisabled}>
              {editing ? 'Update Warehouse' : 'Create Warehouse'}
            </Button>
            <Button variant="outline" onClick={onClear}>
              Clear
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
