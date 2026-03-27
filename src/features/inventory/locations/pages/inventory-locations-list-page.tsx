import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { InventoryLocationsTable } from '../components/inventory-locations-table';

export function InventoryLocationsListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <PermissionGuard permissionKey={PermissionKeys.CanCreateInventoryLocation}>
          <Button asChild>
            <Link to="/inventory/locations/new">New inventory location</Link>
          </Button>
        </PermissionGuard>
      </div>
      <InventoryLocationsTable />
    </div>
  );
}
