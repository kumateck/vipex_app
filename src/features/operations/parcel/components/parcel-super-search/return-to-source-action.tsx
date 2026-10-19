import { Button } from '@/components/ui/button';
import { useReturnToSourceAvailability } from '../../hooks';

type ReturnParcel = { id: string; bookingCode: string; sourceName: string };

export function ReturnToSourceAction({
  parcel,
  branchId,
  sourceName,
  canRecordReturn,
  onReturnToSource,
  showUnavailableReason = false,
}: {
  parcel: {
    id: string;
    bookingCode: string;
    destinationId: string;
    status: number;
    isDeleted: boolean;
  };
  branchId: string | null;
  sourceName: string;
  canRecordReturn: boolean;
  onReturnToSource: (parcel: ReturnParcel) => void;
  showUnavailableReason?: boolean;
}) {
  const reason = useReturnToSourceAvailability(parcel, branchId, canRecordReturn);
  if (reason && !showUnavailableReason) return null;

  return (
    <div className="space-y-2 rounded-md border p-3">
      <Button
        variant="outline"
        disabled={Boolean(reason)}
        onClick={() =>
          onReturnToSource({ id: parcel.id, bookingCode: parcel.bookingCode, sourceName })
        }
      >
        Return to Source
      </Button>
      {reason ? <p className="text-sm text-muted-foreground">{reason}</p> : null}
    </div>
  );
}
