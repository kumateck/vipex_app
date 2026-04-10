import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { useListWarehouseOptionsQuery } from '@/features/warehouses';
import { ParcelHolderType } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useCreateParcelInternalTransferMutation,
  useLazySearchParcelsQuery,
} from '../../api/parcel.api';
import { ParcelInternalTransfersCreateFormCard } from './parcel-internal-transfers-create-form-card';
import { ParcelInternalTransfersSearchCard } from './parcel-internal-transfers-search-card';
import { ParcelInternalTransfersSelectedParcelsCard } from './parcel-internal-transfers-selected-parcels-card';
import { useParcelInternalTransfersSearchColumns } from './use-parcel-internal-transfers-search-columns';

export function ParcelInternalTransfersPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? '';
  const branchId = user?.branch?.id ?? '';
  const defaultLocationId = user?.location?.id ?? '';
  const canCreate = user?.permissions?.includes(PermissionKeys.CanCreateParcelInternalTransfers);
  const canRead = user?.permissions?.includes(PermissionKeys.CanReadParcelInternalTransfers);

  const [sourceHolderType, setSourceHolderType] = useState(
    defaultLocationId ? String(ParcelHolderType.LOCATION) : String(ParcelHolderType.BRANCH),
  );
  const [sourceLocationId, setSourceLocationId] = useState(defaultLocationId);
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationHolderType, setDestinationHolderType] = useState(
    String(ParcelHolderType.LOCATION),
  );
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParcels, setSelectedParcels] = useState<ParcelSearchRow[]>([]);
  const [agedOnly, setAgedOnly] = useState(true);
  const [storageChargeAccruingOnly, setStorageChargeAccruingOnly] = useState(false);

  const { data: locationOptions = [] } = useListLocationOptionsQuery(
    { companyId, branchId },
    { skip: !companyId || !branchId },
  );
  const { data: warehouseOptions = [] } = useListWarehouseOptionsQuery(
    { companyId, branchId, activeOnly: true },
    { skip: !companyId || !branchId },
  );

  const [searchParcels, { data: searchResults, isFetching: isSearching }] =
    useLazySearchParcelsQuery();
  const [createTransfer, { isLoading: isCreating }] = useCreateParcelInternalTransferMutation();

  const selectedParcelIds = useMemo(
    () => new Set(selectedParcels.map((parcel) => parcel.id)),
    [selectedParcels],
  );

  const handleSearchParcels = useCallback(async () => {
    if (!companyId || !branchId) {
      toast.error('Branch context is required');
      return;
    }
    if (!searchTerm.trim() && !agedOnly && !storageChargeAccruingOnly) {
      toast.error('Enter a parcel search term or use an ageing filter');
      return;
    }

    try {
      await searchParcels({
        page: 1,
        pageSize: 20,
        search: searchTerm.trim() || undefined,
        filters: {
          companyId,
          destinationId: branchId,
          agedOnly,
          storageChargeAccruing: storageChargeAccruingOnly,
        },
      }).unwrap();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Search failed');
    }
  }, [agedOnly, branchId, companyId, searchParcels, searchTerm, storageChargeAccruingOnly]);

  const handleAddParcel = useCallback((parcel: ParcelSearchRow) => {
    setSelectedParcels((current) =>
      current.some((item) => item.id === parcel.id) ? current : [...current, parcel],
    );
  }, []);

  const handleRemoveParcel = useCallback((parcelId: string) => {
    setSelectedParcels((current) => current.filter((parcel) => parcel.id !== parcelId));
  }, []);

  const handleCreateTransfer = useCallback(async () => {
    if (!branchId) {
      toast.error('Branch context is required');
      return;
    }
    if (selectedParcels.length === 0) {
      toast.error('Select at least one parcel');
      return;
    }

    try {
      await createTransfer({
        branchId,
        sourceHolderType: Number(sourceHolderType),
        sourceLocationId:
          Number(sourceHolderType) === ParcelHolderType.LOCATION ? sourceLocationId || null : null,
        sourceWarehouseId:
          Number(sourceHolderType) === ParcelHolderType.WAREHOUSE
            ? sourceWarehouseId || null
            : null,
        destinationHolderType: Number(destinationHolderType),
        destinationLocationId:
          Number(destinationHolderType) === ParcelHolderType.LOCATION
            ? destinationLocationId || null
            : null,
        destinationWarehouseId:
          Number(destinationHolderType) === ParcelHolderType.WAREHOUSE
            ? destinationWarehouseId || null
            : null,
        notes: notes.trim() || null,
        parcelIds: selectedParcels.map((parcel) => parcel.id),
      }).unwrap();

      toast.success('Internal transfer created');
      setSelectedParcels([]);
      setNotes('');
      setSearchTerm('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create internal transfer');
    }
  }, [
    branchId,
    createTransfer,
    destinationHolderType,
    destinationLocationId,
    destinationWarehouseId,
    notes,
    selectedParcels,
    sourceHolderType,
    sourceLocationId,
    sourceWarehouseId,
  ]);

  const searchColumns = useParcelInternalTransfersSearchColumns({
    selectedParcelIds,
    onAddParcel: handleAddParcel,
  });

  if (!canRead) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Internal Transfers Restricted</CardTitle>
          <CardDescription>
            Your role does not include permission to view parcel internal transfers.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Create Parcel Internal Transfer</h1>
          <p className="text-sm text-muted-foreground">
            Move parcels between branch holders without changing shipment status.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/parcels/internal-transfers/history')}>
          View History
        </Button>
      </div>

      <ScrollableWrapper>
        <div className="grid gap-4 xl:grid-cols-[430px_minmax(0,1fr)]">
          <ParcelInternalTransfersCreateFormCard
            canCreate={Boolean(canCreate)}
            sourceHolderType={sourceHolderType}
            onSourceHolderTypeChange={setSourceHolderType}
            sourceLocationId={sourceLocationId}
            onSourceLocationIdChange={setSourceLocationId}
            sourceWarehouseId={sourceWarehouseId}
            onSourceWarehouseIdChange={setSourceWarehouseId}
            destinationHolderType={destinationHolderType}
            onDestinationHolderTypeChange={setDestinationHolderType}
            destinationLocationId={destinationLocationId}
            onDestinationLocationIdChange={setDestinationLocationId}
            destinationWarehouseId={destinationWarehouseId}
            onDestinationWarehouseIdChange={setDestinationWarehouseId}
            notes={notes}
            onNotesChange={setNotes}
            locationOptions={locationOptions}
            warehouseOptions={warehouseOptions}
            isCreating={isCreating}
            selectedParcelsCount={selectedParcels.length}
            onCreateTransfer={() => void handleCreateTransfer()}
          />

          <div className="space-y-4">
            <ParcelInternalTransfersSearchCard
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              agedOnly={agedOnly}
              onAgedOnlyChange={setAgedOnly}
              storageChargeAccruingOnly={storageChargeAccruingOnly}
              onStorageChargeAccruingOnlyChange={setStorageChargeAccruingOnly}
              onSearch={() => void handleSearchParcels()}
              isSearching={isSearching}
              rows={searchResults?.data ?? []}
              columns={searchColumns}
            />

            <ParcelInternalTransfersSelectedParcelsCard
              selectedParcels={selectedParcels}
              onRemoveParcel={handleRemoveParcel}
            />
          </div>
        </div>
      </ScrollableWrapper>
    </div>
  );
}
