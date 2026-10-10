import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useReturnedRiderParcels } from '../../hooks';
import { ReturnedRiderParcelsTable } from './returned-rider-parcels-table';

export function ReturnedRiderParcels() {
  const list = useReturnedRiderParcels();
  return (
    <div className="w-full p-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Rider Returns</CardTitle>
            <CardDescription>
              Parcels brought back by riders. Review each return and either make it available for
              office pickup or redispatch it to a rider.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReturnedRiderParcelsTable
              rows={list.rows}
              isFetching={list.isFetching}
              hasError={Boolean(list.error)}
              searchInput={list.searchInput}
              onSearchInputChange={list.setSearchInput}
              onSearch={list.submitSearch}
              riders={list.riders}
              riderUserId={list.riderUserId}
              onRiderChange={list.setRiderUserId}
              busyParcelId={list.busyParcelId}
              onReprocess={list.reprocess}
              page={list.page}
              hasNextPage={list.meta?.hasNextPage ?? false}
              onPageChange={list.setPage}
              selectedParcelIds={list.selectedParcelIds}
              onToggleParcelSelected={list.toggleParcelSelected}
              onPageSelectionChange={list.setPageSelected}
              onClearSelection={list.clearSelection}
              onBulkRedispatch={list.bulkRedispatch}
              isBulkRedispatching={list.isBulkRedispatching}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
