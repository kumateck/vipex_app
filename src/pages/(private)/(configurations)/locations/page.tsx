/**
 * Location list: uses DataTable and locations API (useListLocationsQuery).
 */
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/datatable';
import { locationsColumns, type LocationRow } from '@/features/locations/columns';
import { useListLocationsQuery, type Location } from '@/features/locations/api';
import { useListBranchesQuery } from '@/features/branches/api';
import { Button } from '@/components/ui/button';

const Locations = () => {
  const { data, isLoading, isError, error, refetch } = useListLocationsQuery({ limit: 50 });
  const { data: branchesData, isLoading: isLoadingBranches } = useListBranchesQuery({ limit: 50 });
  const branchNameById = new Map((branchesData?.data ?? []).map((branch) => [branch.id, branch.name]));
  const rows: LocationRow[] = (data?.data ?? []).map((location) => ({
    ...location,
    branchName: branchNameById.get(location.branchId) ?? location.branchId,
  }));

  if (isError) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
        <p className="text-destructive">
          {error && typeof (error as { data?: { message?: string } }).data?.message === 'string'
            ? (error as { data: { message: string } }).data.message
            : 'Failed to load locations. Please try again.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/locations/new">New location</Link>
        </Button>
      </div>
      <DataTable<LocationRow, unknown>
        data={rows}
        columns={locationsColumns}
        paginationMode="client"
        loading={isLoading || isLoadingBranches}
      />
    </div>
  );
};

export default Locations;
