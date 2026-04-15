import type { StockRequestAllocationCandidate } from '@/features/inventory/stock/types/inventory-stock.types';

interface StockRequestAllocationCandidatesTableProps {
  candidates: StockRequestAllocationCandidate[];
  locationNameById: Map<string, string>;
}

export function StockRequestAllocationCandidatesTable({
  candidates,
  locationNameById,
}: StockRequestAllocationCandidatesTableProps) {
  if (!candidates.length) return null;

  return (
    <div className="mb-4">
      <p className="text-sm font-medium mb-2">Suggested source order (auto-allocation)</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4">Location</th>
              <th className="text-left py-2 pr-4">Available (base)</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.locationId} className="border-b">
                <td className="py-2 pr-4">
                  {locationNameById.get(candidate.locationId) ?? candidate.locationId}
                </td>
                <td className="py-2 pr-4">{candidate.availableQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
