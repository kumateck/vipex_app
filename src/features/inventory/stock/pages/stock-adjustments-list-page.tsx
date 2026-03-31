import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { StockAdjustmentsTable } from '../components/stock-adjustments-table';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function StockAdjustmentsListPage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="flex justify-end">
          <PermissionGuard permissionKey={PermissionKeys.CanCreateStockAdjustment}>
            <Button asChild>
              <Link to="/inventory/stock-adjustments/new">New stock adjustment</Link>
            </Button>
          </PermissionGuard>
        </div>
        <StockAdjustmentsTable />
      </div>
    </ScrollableWrapper>
  );
}
