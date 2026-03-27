import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { LocationsTable } from '../components/locations-table';

export function LocationsListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <PermissionGuard permissionKey={PermissionKeys.CanCreateLocations}>
          <Button asChild>
            <Link to="/locations/new">New location</Link>
          </Button>
        </PermissionGuard>
      </div>
      <LocationsTable />
    </div>
  );
}
