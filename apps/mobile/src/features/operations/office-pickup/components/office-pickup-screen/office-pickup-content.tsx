import { Text } from 'react-native';
import { AppButton, AppCard, MobileNoAccess } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { OfficePickupList, useOfficePickupHandover } from '../../hooks';
import type { PickupContext } from '../../types';
import { pickupStyles } from './office-pickup.styles';
import { PickupHandoverPanel } from './pickup-handover-panel';
import { PickupParcelFinder } from './pickup-parcel-finder';
import { PickupSuccessCard } from './pickup-success-card';

export function OfficePickupContent({
  context,
  list,
  handover,
  isWhatsAppAvailable,
  onOpenBatch,
}: {
  context: PickupContext;
  list: OfficePickupList;
  handover: ReturnType<typeof useOfficePickupHandover>;
  isWhatsAppAvailable: boolean;
  onOpenBatch: () => void;
}) {
  const { theme } = useAppearance();
  if (!context.branchId) {
    return (
      <MobileNoAccess message="Your user account needs an assigned branch to process pickups." />
    );
  }
  if (list.settingsError) {
    return (
      <AppCard>
        <Text style={[pickupStyles.text, { color: theme.colors.textMuted }]}>
          Unable to load pickup settings for your branch.
        </Text>
        <AppButton title="Try again" variant="secondary" onPress={() => void list.refresh()} />
      </AppCard>
    );
  }
  if (handover.completed) {
    return <PickupSuccessCard completed={handover.completed} onDone={handover.close} />;
  }
  if (handover.parcel) {
    return (
      <PickupHandoverPanel
        handover={handover}
        context={context}
        isPickupOtpRequired={list.isPickupOtpRequired}
        isPickupQueueEnabled={list.isPickupQueueEnabled}
        isWhatsAppAvailable={isWhatsAppAvailable}
      />
    );
  }
  return (
    <>
      <AppButton title="Hand over multiple parcels" variant="secondary" onPress={onOpenBatch} />
      <PickupParcelFinder list={list} onOpen={(parcel) => void handover.open(parcel)} />
    </>
  );
}
