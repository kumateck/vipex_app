import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { StockMovementsTable } from '../components/stock-movements-table';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function StockMovementsListPage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="flex justify-end">
          <PermissionGuard permissionKey={PermissionKeys.CanCreateStockMovement}>
            <Button asChild>
              <Link to="/inventory/stock-movements/new">New stock movement</Link>
            </Button>
          </PermissionGuard>
        </div>
        <StockMovementsTable />
      </div>
    </ScrollableWrapper>
  );
}
