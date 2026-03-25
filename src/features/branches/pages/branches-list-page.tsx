import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BranchesTable } from '../components/branches-table';

export function BranchesListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/branches/new">New branch</Link>
        </Button>
      </div>
      <BranchesTable />
    </div>
  );
}
