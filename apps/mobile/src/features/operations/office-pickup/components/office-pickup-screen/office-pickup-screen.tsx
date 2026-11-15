import { MobileParcelBatchHandover } from '@mobile/features/operations/parcel-batch-handover';
import { useCallback, useState } from 'react';
import { AppScreen } from '@mobile/components/screen';
import { AppPageHeader, MobileNoAccess } from '@mobile/components/ui/mobile';
import { canCompleteOfficePickup } from '@mobile/lib/permissions';
import { useAuth } from '@mobile/providers/auth-provider';
import {
  useOfficePickupHandover,
  useOfficePickupList,
  usePickupContext,
  useWhatsAppAvailability,
} from '../../hooks';
import { OfficePickupContent } from './office-pickup-content';

/**
 * Mobile counterpart of the web "Waiting for Pickup" page: hand a sender-paid
 * parcel to its receiver after the collection OTP is verified.
 */
export function OfficePickupScreen() {
  const { session } = useAuth();
  const [batchOpen, setBatchOpen] = useState(false);
  const allowed = canCompleteOfficePickup(session.user?.permissions ?? []);
  const context = usePickupContext();
  const list = useOfficePickupList(context, allowed);
  const isWhatsAppAvailable = useWhatsAppAvailability();
  const reloadList = list.reload;
  const onFinished = useCallback(() => void reloadList(), [reloadList]);
  const handover = useOfficePickupHandover({
    context,
    isPickupOtpRequired: list.isPickupOtpRequired,
    isPickupQueueEnabled: list.isPickupQueueEnabled,
    isWhatsAppAvailable,
    onFinished,
  });

  if (!allowed) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to complete office pickups." />
      </AppScreen>
    );
  }

  if (batchOpen && context.branchId) {
    return (
      <AppScreen keyboardShouldPersistTaps="handled">
        <MobileParcelBatchHandover
          key={context.branchId}
          workflow="office-pickup"
          onClose={() => setBatchOpen(false)}
          onConfirmed={onFinished}
          whatsappAvailable={isWhatsAppAvailable}
        />
      </AppScreen>
    );
  }

  const subtitle = list.isPickupQueueEnabled
    ? 'Sender-paid parcels awaiting office pickup and identity verification.'
    : 'Search for a sender-paid parcel to process pickup at this branch.';

  return (
    <AppScreen
      keyboardShouldPersistTaps="handled"
      refreshing={list.loading}
      onRefresh={handover.parcel ? undefined : () => void list.refresh()}
    >
      <AppPageHeader title="Waiting for Pickup" subtitle={subtitle} />
      <OfficePickupContent
        context={context}
        list={list}
        handover={handover}
        isWhatsAppAvailable={isWhatsAppAvailable}
        onOpenBatch={() => setBatchOpen(true)}
      />
    </AppScreen>
  );
}
