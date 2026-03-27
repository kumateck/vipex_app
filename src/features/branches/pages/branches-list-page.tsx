import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { BranchesTable } from '../components/branches-table';

export function BranchesListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <PermissionGuard permissionKey={PermissionKeys.CanCreateBranches}>
          <Button asChild>
            <Link to="/branches/new">New branch</Link>
          </Button>
        </PermissionGuard>
      </div>
      <BranchesTable />
    </div>
  );
}
