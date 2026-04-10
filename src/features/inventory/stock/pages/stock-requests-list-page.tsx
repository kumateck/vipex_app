import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { PermissionKeys } from '@/shared/permissions/constants';
import { StockRequestsTable } from '../components/stock-requests-table';

export function StockRequestsListPage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="flex justify-end gap-2">
          <PermissionGuard permissionKey={PermissionKeys.CanReadStockRequests}>
            <Button asChild variant="outline">
              <Link to="/inventory/stock-lots">Stock Lots</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/inventory/stock-reservations">Reservations</Link>
            </Button>
          </PermissionGuard>
          <PermissionGuard permissionKey={PermissionKeys.CanReadStockRequests}>
            <Button asChild variant="outline">
              <Link to="/inventory/stock-reservations/exceptions">Exceptions</Link>
            </Button>
          </PermissionGuard>
          <PermissionGuard permissionKey={PermissionKeys.CanCreateStockRequest}>
            <Button asChild>
              <Link to="/inventory/stock-requests/new">New stock request</Link>
            </Button>
          </PermissionGuard>
        </div>
        <StockRequestsTable />
      </div>
    </ScrollableWrapper>
  );
}
