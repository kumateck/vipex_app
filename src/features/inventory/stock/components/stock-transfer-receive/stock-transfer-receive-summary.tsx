import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';

interface StockTransferReceiveSummaryProps {
  receivedBase: number;
  damagedBase: number;
  missingBase: number;
  acceptedBase: number;
  remainingAfterAckBase: number;
  conversionRows: { unitOfMeasure: number; factorToBase: number }[];
}

export function StockTransferReceiveSummary({
  receivedBase,
  damagedBase,
  missingBase,
  acceptedBase,
  remainingAfterAckBase,
  conversionRows,
}: StockTransferReceiveSummaryProps) {
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
        <span className="font-medium">Accepted (auto):</span>{' '}
        {formatBaseQuantityWithBestUnits(String(acceptedBase), conversionRows)}
      </p>
      <p>
        <span className="font-medium">Pending after this acknowledgement:</span>{' '}
        {formatBaseQuantityWithBestUnits(String(remainingAfterAckBase), conversionRows)}
      </p>
    </div>
  );
}
