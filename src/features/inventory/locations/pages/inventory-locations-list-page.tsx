import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InventoryLocationsTable } from '../components/inventory-locations-table';

export function InventoryLocationsListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/inventory/locations/new">New inventory location</Link>
        </Button>
      </div>
      <InventoryLocationsTable />
    </div>
  );
}
