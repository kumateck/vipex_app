import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function ProcurementHomePage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Procurement</CardTitle>
            <CardDescription>Choose a procurement workflow.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
              <Button asChild variant="outline">
                <Link to="/procurement/suppliers">Suppliers list</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementSuppliers}>
              <Button asChild variant="outline">
                <Link to="/procurement/suppliers/new">Create supplier</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
              <Button asChild variant="outline">
                <Link to="/procurement/purchase-requests">Purchase request list</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
              <Button asChild variant="outline">
                <Link to="/procurement/demands">Demands list</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementPurchaseRequests}>
              <Button asChild variant="outline">
                <Link to="/procurement/demands/new">Create demand</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementPurchaseRequests}>
              <Button asChild variant="outline">
                <Link to="/procurement/demands/fleet-low-stock">Fleet low-stock intake</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementPurchaseRequests}>
              <Button asChild variant="outline">
                <Link to="/procurement/demands/inventory-low-stock">
                  Inventory low-stock intake
                </Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
              <Button asChild variant="outline">
                <Link to="/procurement/demands/consolidations">Demand consolidations</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementPurchaseRequests}>
              <Button asChild variant="outline">
                <Link to="/procurement/demands/consolidations/new">Create consolidation</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanApproveProcurementPurchaseRequests}>
              <Button asChild variant="outline">
                <Link to="/procurement/demands/approvals">Demand approvals</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
              <Button asChild variant="outline">
                <Link to="/procurement/supplier-quotes">Supplier quotes</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementPurchaseRequests}>
              <Button asChild variant="outline">
                <Link to="/procurement/supplier-quotes/new">Create supplier quote</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
              <Button asChild variant="outline">
                <Link to="/procurement/purchase-orders">Purchase orders</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementPurchaseRequests}>
              <Button asChild variant="outline">
                <Link to="/procurement/purchase-orders/new">Create purchase order</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
              <Button asChild variant="outline">
                <Link to="/procurement/goods-receipts">Goods receipts</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementPurchaseRequests}>
              <Button asChild variant="outline">
                <Link to="/procurement/goods-receipts/new">Create goods receipt</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
              <Button asChild variant="outline">
                <Link to="/procurement/fleet-policies">Fleet policy rules</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementPurchaseRequests}>
              <Button asChild variant="outline">
                <Link to="/procurement/fleet-policies/new">Create fleet policy rule</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementPurchaseRequests}>
              <Button asChild variant="outline">
                <Link to="/procurement/purchase-requests/new">Create purchase request</Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionKey={PermissionKeys.CanApproveProcurementPurchaseRequests}>
              <Button asChild>
                <Link to="/procurement/purchase-requests/approvals">Approvals</Link>
              </Button>
            </PermissionGuard>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
