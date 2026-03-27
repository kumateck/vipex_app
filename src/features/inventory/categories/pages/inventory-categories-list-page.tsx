import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { InventoryCategoriesTable } from '../components/inventory-categories-table';

export function InventoryCategoriesListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <PermissionGuard permissionKey={PermissionKeys.CanCreateProductCategory}>
          <Button asChild>
            <Link to="/inventory/categories/new">New category</Link>
          </Button>
        </PermissionGuard>
      </div>
      <InventoryCategoriesTable />
    </div>
  );
}
