import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';

interface StockRequestAcknowledgeSummaryProps {
  receivedBase: number;
  damagedBase: number;
  missingBase: number;
  acknowledgedBase: number;
  pendingAfterBase: number;
  conversionRows: { unitOfMeasure: number; factorToBase: number }[];
}

export function StockRequestAcknowledgeSummary({
  receivedBase,
  damagedBase,
  missingBase,
  acknowledgedBase,
  pendingAfterBase,
  conversionRows,
}: StockRequestAcknowledgeSummaryProps) {
  return (
    <div className="rounded-md border p-3 text-sm space-y-1">
      <p>
        <span className="font-medium">Received:</span>{' '}
        {formatBaseQuantityWithBestUnits(String(receivedBase), conversionRows)}
      </p>
      <p>
        <span className="font-medium">Damaged:</span>{' '}
        {formatBaseQuantityWithBestUnits(String(damagedBase), conversionRows)}
      </p>
      <p>
        <span className="font-medium">Missing:</span>{' '}
        {formatBaseQuantityWithBestUnits(String(missingBase), conversionRows)}
      </p>
      <p>
        <span className="font-medium">Acknowledged (auto):</span>{' '}
        {formatBaseQuantityWithBestUnits(String(acknowledgedBase), conversionRows)}
      </p>
      <p>
        <span className="font-medium">Pending after this acknowledgement:</span>{' '}
        {formatBaseQuantityWithBestUnits(String(pendingAfterBase), conversionRows)}
      </p>
    </div>
  );
}
