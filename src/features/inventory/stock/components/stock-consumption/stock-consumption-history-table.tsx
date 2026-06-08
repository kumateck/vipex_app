import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import type { UnitConversion } from '@/shared/inventory/unit-conversion';

interface StockConsumptionHistoryRow {
  id: string;
  productId: string;
  productName?: string | null;
  locationId: string;
  locationName?: string | null;
  quantity: string;
  createdAt?: string | null;
  notes?: string | null;
}

interface StockConsumptionHistoryTableProps {
  rows: StockConsumptionHistoryRow[];
  productConversionsById?: Map<string, UnitConversion[]>;
}

export function StockConsumptionHistoryTable({
  rows,
  productConversionsById,
}: StockConsumptionHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consumption History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Product</th>
                <th className="text-left py-2 pr-4">Location</th>
                <th className="text-left py-2 pr-4">Quantity</th>
                <th className="text-left py-2 pr-4">Date</th>
                <th className="text-left py-2 pr-4">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="py-2 pr-4">{row.productName || row.productId}</td>
                  <td className="py-2 pr-4">{row.locationName || row.locationId}</td>
                  <td className="py-2 pr-4">
                    {formatBaseQuantityWithBestUnits(
                      row.quantity,
                      productConversionsById?.get(row.productId),
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {row.createdAt ? formatDateTimeShared(row.createdAt) : '-'}
                  </td>
                  <td className="py-2 pr-4">{row.notes || '-'}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={5}>
                    No consumption records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
