/**
 * Branch list: uses DataTable and branches API (useListBranchesQuery).
 */
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/datatable';
import { branchesColumns } from '@/features/branches/columns';
import { useListBranchesQuery, type Branch } from '@/features/branches/api';
import { Button } from '@/components/ui/button';

const Branches = () => {
  const { data, isLoading, isError, error, refetch } = useListBranchesQuery({ limit: 50 });

  if (isError) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
        <p className="text-destructive">
          {error && typeof (error as { data?: { message?: string } }).data?.message === 'string'
            ? (error as { data: { message: string } }).data.message
            : 'Failed to load branches. Please try again.'}
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
          <Link to="/branches/new">New branch</Link>
        </Button>
      </div>
      <DataTable<Branch, unknown>
        data={data?.data ?? []}
        columns={branchesColumns}
        mode="client"
        loading={isLoading}
      />
    </div>
  );
};

export default Branches;
