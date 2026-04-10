import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { PermissionKeys } from '@/shared/permissions/constants';
import { StockMaintenanceTable } from '../components/stock-maintenance-table';

export function StockMaintenanceListPage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="flex justify-end">
          <PermissionGuard permissionKey={PermissionKeys.CanCreateStockMaintenanceRecord}>
            <Button asChild>
              <Link to="/inventory/stock-maintenance/new">New maintenance record</Link>
            </Button>
          </PermissionGuard>
        </div>
        <StockMaintenanceTable />
      </div>
    </ScrollableWrapper>
  );
}
