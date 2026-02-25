import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LocationsTable } from '../components/locations-table';

export function LocationsListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/locations/new">New location</Link>
        </Button>
      </div>
      <LocationsTable />
    </div>
  );
}
