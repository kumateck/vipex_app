import { useReturnToSourceList } from '../../hooks';
import { ParcelSuperSearchDetailsDialog } from '../parcel-super-search';
import { ReturnToSourceTable } from './return-to-source-table';

export function ParcelReturnToSourcePage() {
  const list = useReturnToSourceList();

  return (
    <div className="w-full p-4">
      <ReturnToSourceTable
        rows={list.rows}
        loading={list.isFetching}
        searchInput={list.searchInput}
        onSearchInputChange={list.setSearchInput}
        onSearch={list.submitSearch}
        page={list.page}
        totalRecords={list.meta?.totalRecords ?? 0}
        hasNextPage={list.meta?.hasNextPage ?? false}
        onPageChange={list.setPage}
        canCreateShipment={list.canCreateShipment}
        canManageReconciliation={list.canManageReconciliation}
        onViewDetails={list.setSelectedParcelId}
        onStartShipment={list.startShipment}
        onManageReconciliation={list.manageReconciliation}
      />
      <ParcelSuperSearchDetailsDialog
        parcelId={list.selectedParcelId}
        companyId={list.companyId}
        branchNameById={list.branchNameById}
        selectedParcelRow={list.selectedParcelRow}
        onClose={() => list.setSelectedParcelId(null)}
        branchId={null}
        canRecordReturn={false}
        onReturnToSource={() => {}}
      />
    </div>
  );
}
