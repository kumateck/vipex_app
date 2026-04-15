import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { InventoryLocationType } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useUpsertInventoryReorderPolicyMutation } from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';

const LOCATION_TYPE_OPTIONS = [
  { value: InventoryLocationType.MAIN_STORE, label: 'Main store' },
  { value: InventoryLocationType.BRANCH_STORE, label: 'Branch store' },
  { value: InventoryLocationType.CONSUMPTION_LOCATION, label: 'Consumption location' },
] as const;

type ReorderPolicyFormProps = {
  onSaved: () => void;
};

export function ReorderPolicyForm({ onSaved }: ReorderPolicyFormProps) {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const defaultBranchId = user?.branch?.id ?? '';

  const [productId, setProductId] = useState('');
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [locationType, setLocationType] = useState<number>(InventoryLocationType.BRANCH_STORE);
  const [locationId, setLocationId] = useState<string>('all');
  const [reorderPoint, setReorderPoint] = useState('0');
  const [targetLevel, setTargetLevel] = useState('0');
  const [safetyStock, setSafetyStock] = useState('0');
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState('');

  const { data: products = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: branches = [] } = useListBranchOptionsQuery({ companyId }, { skip: !companyId });
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    {
      companyId,
      branchId: branchId || undefined,
      locationType,
    },
    { skip: !companyId || !branchId },
  );

  const [upsertPolicy, { isLoading }] = useUpsertInventoryReorderPolicyMutation();

  const canSubmit = useMemo(
    () =>
      Boolean(productId && branchId) &&
      /^\d+$/.test(reorderPoint) &&
      /^\d+$/.test(targetLevel) &&
      /^\d+$/.test(safetyStock),
    [productId, branchId, reorderPoint, targetLevel, safetyStock],
  );

  const handleSave = async () => {
    if (!canSubmit) {
      toast.error('Select product and branch, then enter valid numeric values.');
      return;
    }

    try {
      await upsertPolicy({
        productId,
        branchId,
        locationType,
        locationId: locationId === 'all' ? null : locationId,
        reorderPoint,
        targetLevel,
        safetyStock,
        active,
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success('Reorder policy saved.');
      onSaved();
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'data' in error
          ? (error as { data?: { error?: { message?: string } } }).data?.error?.message
          : undefined;
      toast.error(message || 'Failed to save reorder policy.');
    }
  };

  return (
    <FieldGroup>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field>
          <FieldLabel>Product</FieldLabel>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Branch</FieldLabel>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Location type</FieldLabel>
          <Select
            value={String(locationType)}
            onValueChange={(value) => setLocationType(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location type" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Field>
          <FieldLabel>Location override (optional)</FieldLabel>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger>
              <SelectValue placeholder="Branch+type default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Branch+type default</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Reorder point (base)</FieldLabel>
          <Input value={reorderPoint} onChange={(event) => setReorderPoint(event.target.value)} />
        </Field>

        <Field>
          <FieldLabel>Target level (base)</FieldLabel>
          <Input value={targetLevel} onChange={(event) => setTargetLevel(event.target.value)} />
        </Field>

        <Field>
          <FieldLabel>Safety stock (base)</FieldLabel>
          <Input value={safetyStock} onChange={(event) => setSafetyStock(event.target.value)} />
        </Field>
      </div>

      <Field>
        <FieldLabel>Notes</FieldLabel>
        <Input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional"
        />
      </Field>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={active} onCheckedChange={(checked) => setActive(checked === true)} />
          Active policy
        </label>
        <Button type="button" onClick={handleSave} disabled={!canSubmit || isLoading}>
          {isLoading ? 'Saving...' : 'Save policy'}
        </Button>
      </div>
    </FieldGroup>
  );
}
