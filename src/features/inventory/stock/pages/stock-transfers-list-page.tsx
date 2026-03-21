import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StockTransfersTable } from '../components/stock-transfers-table';

export function StockTransfersListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/inventory/stock-transfers/new">New stock transfer</Link>
        </Button>
      </div>
      <StockTransfersTable />
    </div>
  );
}
