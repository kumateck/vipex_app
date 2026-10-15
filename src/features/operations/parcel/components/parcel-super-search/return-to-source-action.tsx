import { Button } from '@/components/ui/button';
import { canReturnParcelToSource } from '@/shared/shipments/return-to-source';

type ReturnParcel = { id: string; bookingCode: string; sourceName: string };

export function ReturnToSourceAction({
  parcel,
  branchId,
  sourceName,
  canRecordReturn,
  onReturnToSource,
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
}) {
  if (
    !canRecordReturn ||
    branchId !== parcel.destinationId ||
    parcel.isDeleted ||
    !canReturnParcelToSource(parcel.status)
  ) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={() =>
        onReturnToSource({ id: parcel.id, bookingCode: parcel.bookingCode, sourceName })
      }
    >
      Return to Source
    </Button>
  );
}
