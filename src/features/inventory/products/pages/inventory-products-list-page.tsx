import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { InventoryProductsTable } from '../components/inventory-products-table';

export function InventoryProductsListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <PermissionGuard permissionKey={PermissionKeys.CanCreateProduct}>
          <Button asChild>
            <Link to="/inventory/products/new">New inventory product</Link>
          </Button>
        </PermissionGuard>
      </div>
      <InventoryProductsTable />
    </div>
  );
}
