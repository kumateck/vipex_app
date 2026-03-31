import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';

export function ProcurementHomePage() {
  return (
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
  );
}
