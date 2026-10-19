import { Button } from '@/components/ui/button';
import type { EditableParcelInformation } from '../../types';
import { useParcelSenderCorrection } from '../../hooks';
import { ParcelSenderCorrectionDialog } from '../../dialogs/parcel-sender-correction-dialog';

export function ParcelSenderCorrection({
  parcel,
  onCorrected,
}: {
  parcel: EditableParcelInformation;
  onCorrected: () => void;
}) {
  const correction = useParcelSenderCorrection(parcel, onCorrected);
  if (!parcel.senderId) return null;
  return (
    <div className="space-y-2 border-t pt-4">
      <p className="text-sm">
        Sender: {parcel.senderName || 'Unknown'}{' '}
        {parcel.senderPhone ? `(${parcel.senderPhone})` : ''}
      </p>
      <Button type="button" variant="outline" onClick={correction.begin}>
        Correct sender customer
      </Button>
      <ParcelSenderCorrectionDialog correction={correction} />
    </div>
  );
}
