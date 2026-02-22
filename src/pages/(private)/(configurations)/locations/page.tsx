/**
 * Location list: uses DataTable and locations API (useListLocationsQuery).
 */
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/datatable';
import { locationsColumns } from '@/features/locations/columns';
import { useListLocationsQuery, type Location } from '@/features/locations/api';
import { Button } from '@/components/ui/button';

const Locations = () => {
  const { data, isLoading, isError, error, refetch } = useListLocationsQuery({ limit: 50 });

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
      <DataTable<Location, unknown>
        data={data?.data ?? []}
        columns={locationsColumns}
        paginationMode="client"
        loading={isLoading}
      />
    </div>
  );
};

export default Locations;
