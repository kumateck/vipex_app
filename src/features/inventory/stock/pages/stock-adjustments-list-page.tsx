import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StockAdjustmentsTable } from '../components/stock-adjustments-table';

export function StockAdjustmentsListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/inventory/stock-adjustments/new">New stock adjustment</Link>
        </Button>
      </div>
      <StockAdjustmentsTable />
    </div>
  );
}
