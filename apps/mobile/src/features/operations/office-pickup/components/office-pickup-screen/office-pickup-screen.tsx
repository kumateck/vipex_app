import { useCallback } from 'react';
import { Text } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { AppButton, AppCard, AppPageHeader, MobileNoAccess } from '@mobile/components/ui/mobile';
import { canCompleteOfficePickup } from '@mobile/lib/permissions';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import {
  useOfficePickupHandover,
  useOfficePickupList,
  usePickupContext,
  useWhatsAppAvailability,
} from '../../hooks';
import { PickupHandoverPanel } from './pickup-handover-panel';
import { PickupParcelFinder } from './pickup-parcel-finder';
import { PickupSuccessCard } from './pickup-success-card';
import { pickupStyles } from './office-pickup.styles';

/**
 * Mobile counterpart of the web "Waiting for Pickup" page: hand a sender-paid
 * parcel to its receiver after the collection OTP is verified.
 */
export function OfficePickupScreen() {
  const { session } = useAuth();
  const { theme } = useAppearance();
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
      {!context.branchId ? (
        <MobileNoAccess message="Your user account needs an assigned branch to process pickups." />
      ) : list.settingsError ? (
        <AppCard>
          <Text style={[pickupStyles.text, { color: theme.colors.textMuted }]}>
            Unable to load pickup settings for your branch.
          </Text>
          <AppButton title="Try again" variant="secondary" onPress={() => void list.refresh()} />
        </AppCard>
      ) : handover.completed ? (
        <PickupSuccessCard completed={handover.completed} onDone={handover.close} />
      ) : handover.parcel ? (
        <PickupHandoverPanel
          handover={handover}
          context={context}
          isPickupOtpRequired={list.isPickupOtpRequired}
          isPickupQueueEnabled={list.isPickupQueueEnabled}
          isWhatsAppAvailable={isWhatsAppAvailable}
        />
      ) : (
        <PickupParcelFinder list={list} onOpen={(parcel) => void handover.open(parcel)} />
      )}
    </AppScreen>
  );
}
