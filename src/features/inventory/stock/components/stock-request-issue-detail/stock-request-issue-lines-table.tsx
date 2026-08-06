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
  notes?: string | null;
};

type ProductUnitConversion = {
  unitOfMeasure: number;
  factorToBase: string | number;
};

type ProductLookup = {
  name?: string | null;
  unitOfMeasure?: number | null;
  unitConversions?: ProductUnitConversion[] | null;
};

type StockRequestIssueLinesTableProps = {
  lines: StockRequestLine[];
  productById: Map<string, ProductLookup>;
  issueBaseByLineId: Record<string, number>;
  getAvailableBaseForLine: (line: StockRequestLine) => number;
  canFulfill: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  onOpenFulfillDialog: (lineId: string) => void;
  onSubmitIssue: () => void;
};

export function StockRequestIssueLinesTable({
  lines,
  productById,
  issueBaseByLineId,
  getAvailableBaseForLine,
  canFulfill,
  canSubmit,
  isSubmitting,
  onOpenFulfillDialog,
  onSubmitIssue,
}: StockRequestIssueLinesTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Request lines</CardTitle>
        <PermissionGuard permissionKey={PermissionKeys.CanFulfillStockRequest}>
          <Button onClick={onSubmitIssue} disabled={!canSubmit || isSubmitting || !canFulfill}>
            Submit issue
          </Button>
        </PermissionGuard>
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
                <th className="text-left py-2 pr-4">Available to issue</th>
                <th className="text-left py-2 pr-4">Issue quantity</th>
                <th className="text-left py-2 pr-4">Acknowledged</th>
                <th className="text-left py-2 pr-4">Notes</th>
                <th className="text-left py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const product = productById.get(line.productId);
                const productName = product?.name ?? line.productId;
                const conversionRows = (product?.unitConversions ?? []).map((item) => ({
                  unitOfMeasure: item.unitOfMeasure,
                  factorToBase: Number(item.factorToBase),
                }));
                const remainingBase = Math.max(
                  0,
                  Number(line.requestedQuantity) - Number(line.fulfilledQuantity),
                );
                const availableBase = getAvailableBaseForLine(line);
                const issueBase = Math.max(0, issueBaseByLineId[line.id] ?? 0);

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
                      {formatBaseQuantityWithBestUnits(String(remainingBase), conversionRows)}
                    </td>
                    <td className="py-2 pr-4">
                      {formatBaseQuantityWithBestUnits(String(availableBase), conversionRows)}
                    </td>
                    <td className="py-2 pr-4">
                      {issueBase > 0
                        ? formatBaseQuantityWithBestUnits(String(issueBase), conversionRows)
                        : '-'}
                    </td>
                    <td className="py-2 pr-4">
                      {formatBaseQuantityWithBestUnits(
                        line.acknowledgedQuantity ?? '0',
                        conversionRows,
                      )}
                    </td>
                    <td className="py-2 pr-4">{line.notes ?? '-'}</td>
                    <td className="py-2 pr-4">
                      {canFulfill && remainingBase > 0 ? (
                        <PermissionGuard permissionKey={PermissionKeys.CanFulfillStockRequest}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenFulfillDialog(line.id)}
                            disabled={availableBase <= 0 && issueBase <= 0}
                          >
                            Fulfill
                          </Button>
                        </PermissionGuard>
                      ) : (
                        '-'
                      )}
                    </td>
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
