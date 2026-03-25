import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InventoryProductsTable } from '../components/inventory-products-table';

export function InventoryProductsListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/inventory/products/new">New inventory product</Link>
        </Button>
      </div>
      <InventoryProductsTable />
    </div>
  );
}
