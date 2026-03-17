import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StockMovementsTable } from '../components/stock-movements-table';

export function StockMovementsListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/inventory/stock-movements/new">New stock movement</Link>
        </Button>
      </div>
      <StockMovementsTable />
    </div>
  );
}
