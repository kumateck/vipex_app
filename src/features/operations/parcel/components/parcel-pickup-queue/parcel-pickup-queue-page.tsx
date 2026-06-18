import { useCallback, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetBranchOperationsSettingsQuery } from '@/features/branches/api/branches.api';
import { ParcelStatus } from '@/db/schemas/enums';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useCreatePickupQueueMutation,
  useGetParcelDetailsQuery,
  useLazySearchParcelsQuery,
} from '../../api/parcel.api';
import { PickupQueueTicketDialog } from './pickup-queue-ticket-dialog';
import { useParcelPickupQueueColumns } from './use-parcel-pickup-queue-columns';

export function ParcelPickupQueuePage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const { data: currentBranch } = useGetBranchOperationsSettingsQuery(branchId ?? '', {
    skip: !branchId,
  });
  const isPickupQueueEnabled = currentBranch?.usePickupQueue ?? false;

  const [searchInput, setSearchInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);

  const [createPickupQueue, { isLoading: isCreatingQueue }] = useCreatePickupQueueMutation();
  const [searchParcels, { data: searchResults, isLoading: isSearching }] =
    useLazySearchParcelsQuery();
  const rows = searchResults?.data ?? [];
  const { data: parcelDetails, refetch: refetchParcelDetails } = useGetParcelDetailsQuery(
    selectedParcel?.id ?? '',
    { skip: !selectedParcel?.id },
  );

  const handleViewQueue = useCallback((parcel: ParcelSearchRow) => {
    setSelectedParcel(parcel);
  }, []);

  const columns = useParcelPickupQueueColumns({ onViewQueue: handleViewQueue });

  const handleSearchSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const term = searchInput.trim();
      if (!term) {
        toast.error('Enter telephone, booking code, tracking code, or name');
        return;
      }
      if (!companyId || !branchId) return;

      setHasSearched(true);
      try {
        await searchParcels({
          page: 1,
          pageSize: 20,
          search: term,
          filters: {
            companyId,
            destinationId: branchId,
            status: ParcelStatus.AWAITING_PICKUP,
          },
        }).unwrap();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Search failed');
      }
    },
    [branchId, companyId, searchInput, searchParcels],
  );

  const handleGenerateQueueTicket = useCallback(async () => {
    if (!selectedParcel) return;

    const queue = await createPickupQueue({
      parcelId: selectedParcel.id,
    }).unwrap();

    await refetchParcelDetails();
    toast.success(`Queue number ${queue.queueCode} generated`);
  }, [createPickupQueue, refetchParcelDetails, selectedParcel]);

  return (
    <div className="w-full space-y-4 p-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Pickup Queue</CardTitle>
            <CardDescription>
              Search awaiting-pickup parcels at the gate and issue a queue number for service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPickupQueueEnabled ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                This branch has not enabled pickup queue yet. Turn on “Use pickup queue” in branch
                settings to use this page.
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => navigate('/branches')}>
                    Open Branch Settings
                  </Button>
                </div>
              </div>
            ) : null}

            <form className="flex items-center gap-2" onSubmit={handleSearchSubmit}>
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by tracking, booking, telephone, or customer name"
              />
              <Button type="submit" disabled={!isPickupQueueEnabled}>
                Search
              </Button>
            </form>

            {!hasSearched ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Search for a parcel first. This page does not preload waiting parcels.
              </div>
            ) : (
              <DataTable
                mode="client"
                data={rows}
                columns={columns}
                loading={isSearching}
                showSearch={false}
                enableVirtualization={false}
              />
            )}
          </CardContent>
        </Card>
      </ScrollableWrapper>

      <PickupQueueTicketDialog
        open={Boolean(selectedParcel)}
        parcel={selectedParcel}
        parcelDetails={parcelDetails}
        isPickupQueueEnabled={isPickupQueueEnabled}
        isCreatingQueue={isCreatingQueue}
        onClose={() => setSelectedParcel(null)}
        onGenerateQueueTicket={() => void handleGenerateQueueTicket()}
      />
    </div>
  );
}
