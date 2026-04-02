import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { StockTransfersTable } from '../components/stock-transfers-table';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function StockTransfersListPage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="flex justify-end">
          <PermissionGuard permissionKey={PermissionKeys.CanCreateStockTransfer}>
            <Button asChild>
              <Link to="/inventory/stock-transfers/new">New stock transfer</Link>
            </Button>
          </PermissionGuard>
        </div>
        <StockTransfersTable />
      </div>
    </ScrollableWrapper>
  );
}
