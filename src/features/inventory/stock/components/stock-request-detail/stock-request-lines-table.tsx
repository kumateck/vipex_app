import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { PermissionKeys } from '@/shared/permissions/constants';

type StockRequestLine = {
  id: string;
  productId: string;
  requestedQuantity: string;
  fulfilledQuantity: string;
  acknowledgedQuantity?: string | null;
  pendingAcknowledgementQuantity?: string | null;
  notes?: string | null;
};

type ProductUnitConversion = {
  unitOfMeasure: number;
  factorToBase: string | number;
};

type ProductLookup = {
  name?: string | null;
  unitConversions?: ProductUnitConversion[] | null;
};

type StockRequestDetails = {
  id: string;
  lines?: StockRequestLine[] | null;
};

type StockRequestLinesTableProps = {
  request: StockRequestDetails;
  productById: Map<string, ProductLookup>;
  canFulfill: boolean;
  canAcknowledge?: boolean;
  showActions?: boolean;
  isAutoFulfilling: boolean;
  onAutoFulfillLine: (lineId: string) => void;
};

export function StockRequestLinesTable({
  request,
  productById,
  canFulfill,
  canAcknowledge = false,
  showActions = true,
  isAutoFulfilling,
  onAutoFulfillLine,
}: StockRequestLinesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request lines</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Product</th>
                <th className="text-left py-2 pr-4">Requested</th>
                <th className="text-left py-2 pr-4">Fulfilled</th>
                <th className="text-left py-2 pr-4">Remaining</th>
                <th className="text-left py-2 pr-4">Acknowledged</th>
                <th className="text-left py-2 pr-4">Notes</th>
                {showActions ? <th className="text-left py-2 pr-4">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {(request.lines ?? []).map((line) => {
                const product = productById.get(line.productId);
                const productName = product?.name ?? line.productId;
                const conversionRows = (product?.unitConversions ?? []).map((item) => ({
                  unitOfMeasure: item.unitOfMeasure,
                  factorToBase: Number(item.factorToBase),
                }));
                const remaining = Math.max(
                  0,
                  Number(line.requestedQuantity) - Number(line.fulfilledQuantity),
                );
                const pendingAck = Math.max(0, Number(line.pendingAcknowledgementQuantity ?? 0));

                return (
                  <tr key={line.id} className="border-b">
                    <td className="py-2 pr-4">{productName}</td>
                    <td className="py-2 pr-4">
                      {formatBaseQuantityWithBestUnits(line.requestedQuantity, conversionRows)}
                    </td>
                    <td className="py-2 pr-4">
                      {formatBaseQuantityWithBestUnits(line.fulfilledQuantity, conversionRows)}
                    </td>
                    <td className="py-2 pr-4">
                      {formatBaseQuantityWithBestUnits(String(remaining), conversionRows)}
                    </td>
                    <td className="py-2 pr-4">
                      {formatBaseQuantityWithBestUnits(
                        line.acknowledgedQuantity ?? '0',
                        conversionRows,
                      )}
                    </td>
                    <td className="py-2 pr-4">{line.notes ?? '-'}</td>
                    {showActions ? (
                      <td className="py-2 pr-4">
                        {canFulfill && remaining > 0 ? (
                          <div className="flex gap-2">
                            <PermissionGuard permissionKey={PermissionKeys.CanFulfillStockRequest}>
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  to={`/inventory/stock-requests/fulfill/${request.id}/${line.id}`}
                                >
                                  Fulfill
                                </Link>
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard permissionKey={PermissionKeys.CanFulfillStockRequest}>
                              <Button
                                size="sm"
                                onClick={() => onAutoFulfillLine(line.id)}
                                disabled={isAutoFulfilling}
                              >
                                Auto Fulfill
                              </Button>
                            </PermissionGuard>
                          </div>
                        ) : null}
                        {canAcknowledge && pendingAck > 0 ? (
                          <div className="mt-2">
                            <PermissionGuard permissionKey={PermissionKeys.CanFulfillStockRequest}>
                              <Button asChild size="sm" variant="secondary">
                                <Link
                                  to={`/inventory/stock-requests/acknowledge/${request.id}/${line.id}`}
                                >
                                  Acknowledge Receipt
                                </Link>
                              </Button>
                            </PermissionGuard>
                          </div>
                        ) : null}
                        {!((canFulfill && remaining > 0) || (canAcknowledge && pendingAck > 0))
                          ? '-'
                          : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
