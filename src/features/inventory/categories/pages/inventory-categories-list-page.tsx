import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InventoryCategoriesTable } from '../components/inventory-categories-table';

export function InventoryCategoriesListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/inventory/categories/new">New category</Link>
        </Button>
      </div>
      <InventoryCategoriesTable />
    </div>
  );
}
