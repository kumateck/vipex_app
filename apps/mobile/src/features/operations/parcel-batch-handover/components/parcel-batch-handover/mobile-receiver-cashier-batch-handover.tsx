import { useWhatsAppAvailability } from '@mobile/features/operations/office-pickup/hooks';
import { MobileParcelBatchHandover } from './mobile-parcel-batch-handover';

export function MobileReceiverCashierBatchHandover({
  onClose,
  onConfirmed,
}: {
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const whatsappAvailable = useWhatsAppAvailability();
  return (
    <MobileParcelBatchHandover
      workflow="receiver-cashier"
      onClose={onClose}
      onConfirmed={onConfirmed}
      whatsappAvailable={whatsappAvailable}
    />
  );
}
