import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatusesTable } from '../components/statuses-table';

export function StatusesListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/statuses/new">New status</Link>
        </Button>
      </div>
      <StatusesTable />
    </div>
  );
}
