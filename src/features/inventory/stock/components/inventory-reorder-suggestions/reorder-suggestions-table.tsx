import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import type { ReorderSuggestion } from '@/features/inventory/stock/types/inventory-stock.types';

function locationTypeLabel(type: number) {
  if (type === 0) return 'Main Store';
  if (type === 1) return 'Branch Store';
  if (type === 2) return 'Consumption Location';
  return 'Unknown';
}

function thresholdSourceLabel(source: ReorderSuggestion['thresholdSource']) {
  if (source === 'location_override') return 'Location override';
  if (source === 'branch_location_type') return 'Branch + type';
  return 'Product default';
}

type ReorderSuggestionsTableProps = {
  rows: ReorderSuggestion[];
  isLoading: boolean;
};

export function ReorderSuggestionsTable({ rows, isLoading }: ReorderSuggestionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4">Product</th>
            <th className="text-left py-2 pr-4">Location</th>
            <th className="text-left py-2 pr-4">Current</th>
            <th className="text-left py-2 pr-4">Reorder point</th>
            <th className="text-left py-2 pr-4">Target</th>
            <th className="text-left py-2 pr-4">Rule source</th>
            <th className="text-left py-2 pr-4">Reorder qty</th>
            <th className="text-left py-2 pr-4">Suggested source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.locationId}:${row.productId}`} className="border-b align-top">
              <td className="py-2 pr-4">
                <div>{row.productName}</div>
                <div className="text-xs text-muted-foreground">{row.productSku}</div>
              </td>
              <td className="py-2 pr-4">
                <div>{row.locationName}</div>
                <div className="text-xs text-muted-foreground">
                  {locationTypeLabel(row.locationType)}
                </div>
              </td>
              <td className="py-2 pr-4">
                {formatBaseQuantityWithBestUnits(row.currentQuantity, undefined)}
              </td>
              <td className="py-2 pr-4">
                {formatBaseQuantityWithBestUnits(row.minStockLevel, undefined)}
              </td>
              <td className="py-2 pr-4">
                {formatBaseQuantityWithBestUnits(row.targetLevel, undefined)}
              </td>
              <td className="py-2 pr-4">{thresholdSourceLabel(row.thresholdSource)}</td>
              <td className="py-2 pr-4">
                {formatBaseQuantityWithBestUnits(row.reorderQuantity, undefined)}
              </td>
              <td className="py-2 pr-4">
                {row.suggestedSources.length ? (
                  <div className="space-y-1">
                    {row.suggestedSources.map((source) => (
                      <div key={source.locationId} className="text-xs">
                        {source.locationName} ({locationTypeLabel(source.locationType)}) -{' '}
                        {formatBaseQuantityWithBestUnits(source.availableQuantity, undefined)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">No source suggestion</span>
                )}
              </td>
            </tr>
          ))}
          {!isLoading && !rows.length ? (
            <tr>
              <td className="py-3 text-muted-foreground" colSpan={8}>
                No reorder suggestions for the selected scope.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
