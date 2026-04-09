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
import { ParcelHolderType } from '@/db/schemas/enums';

type SelectOption = {
  id: string;
  name: string;
};

type ParcelInternalTransfersCreateFormCardProps = {
  canCreate: boolean;
  sourceHolderType: string;
  onSourceHolderTypeChange: (value: string) => void;
  sourceLocationId: string;
  onSourceLocationIdChange: (value: string) => void;
  sourceWarehouseId: string;
  onSourceWarehouseIdChange: (value: string) => void;
  destinationHolderType: string;
  onDestinationHolderTypeChange: (value: string) => void;
  destinationLocationId: string;
  onDestinationLocationIdChange: (value: string) => void;
  destinationWarehouseId: string;
  onDestinationWarehouseIdChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  locationOptions: SelectOption[];
  warehouseOptions: SelectOption[];
  isCreating: boolean;
  selectedParcelsCount: number;
  onCreateTransfer: () => void;
};

export function ParcelInternalTransfersCreateFormCard({
  canCreate,
  sourceHolderType,
  onSourceHolderTypeChange,
  sourceLocationId,
  onSourceLocationIdChange,
  sourceWarehouseId,
  onSourceWarehouseIdChange,
  destinationHolderType,
  onDestinationHolderTypeChange,
  destinationLocationId,
  onDestinationLocationIdChange,
  destinationWarehouseId,
  onDestinationWarehouseIdChange,
  notes,
  onNotesChange,
  locationOptions,
  warehouseOptions,
  isCreating,
  selectedParcelsCount,
  onCreateTransfer,
}: ParcelInternalTransfersCreateFormCardProps) {
  const sourceType = Number(sourceHolderType);
  const destinationType = Number(destinationHolderType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Transfer</CardTitle>
        <CardDescription>
          Choose the current holder and the next holder, then select parcels for the move.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>From</Label>
            <Select
              value={sourceHolderType}
              onValueChange={onSourceHolderTypeChange}
              disabled={!canCreate}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(ParcelHolderType.BRANCH)}>Main Branch</SelectItem>
                <SelectItem value={String(ParcelHolderType.LOCATION)}>Location</SelectItem>
                <SelectItem value={String(ParcelHolderType.WAREHOUSE)}>Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sourceType === ParcelHolderType.LOCATION ? (
            <div className="space-y-2">
              <Label>Source Location</Label>
              <Select
                value={sourceLocationId || undefined}
                onValueChange={onSourceLocationIdChange}
                disabled={!canCreate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source location" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {sourceType === ParcelHolderType.WAREHOUSE ? (
            <div className="space-y-2">
              <Label>Source Warehouse</Label>
              <Select
                value={sourceWarehouseId || undefined}
                onValueChange={onSourceWarehouseIdChange}
                disabled={!canCreate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseOptions.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>To</Label>
            <Select
              value={destinationHolderType}
              onValueChange={onDestinationHolderTypeChange}
              disabled={!canCreate}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(ParcelHolderType.BRANCH)}>Main Branch</SelectItem>
                <SelectItem value={String(ParcelHolderType.LOCATION)}>Location</SelectItem>
                <SelectItem value={String(ParcelHolderType.WAREHOUSE)}>Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {destinationType === ParcelHolderType.LOCATION ? (
            <div className="space-y-2">
              <Label>Destination Location</Label>
              <Select
                value={destinationLocationId || undefined}
                onValueChange={onDestinationLocationIdChange}
                disabled={!canCreate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination location" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {destinationType === ParcelHolderType.WAREHOUSE ? (
            <div className="space-y-2">
              <Label>Destination Warehouse</Label>
              <Select
                value={destinationWarehouseId || undefined}
                onValueChange={onDestinationWarehouseIdChange}
                disabled={!canCreate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseOptions.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="transfer-notes">Notes</Label>
            <Input
              id="transfer-notes"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Optional transfer note"
              disabled={!canCreate}
            />
          </div>
        </div>

        {canCreate ? (
          <Button onClick={onCreateTransfer} disabled={isCreating}>
            {isCreating ? 'Creating...' : `Create Transfer (${selectedParcelsCount})`}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
