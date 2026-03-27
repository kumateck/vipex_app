import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { StatusesTable } from '../components/statuses-table';

export function StatusesListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <PermissionGuard permissionKey={PermissionKeys.CanCreateStatuses}>
          <Button asChild>
            <Link to="/statuses/new">New status</Link>
          </Button>
        </PermissionGuard>
      </div>
      <StatusesTable />
    </div>
  );
}
