import { Text } from 'react-native';
import { AppButton, AppCard, AppPageHeader } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { BatchHandoverWorkflow } from '@/shared/shipments/parcel-batch-handover';
import { useMobileBatchHandover } from '../../hooks';
import { MobileBatchSelection } from './mobile-batch-selection';
import { MobileBatchVerification } from './mobile-batch-verification';

export function MobileParcelBatchHandover({
  workflow,
  onClose,
  onConfirmed,
  whatsappAvailable,
}: {
  workflow: BatchHandoverWorkflow;
  onClose: () => void;
  onConfirmed: () => void;
  whatsappAvailable: boolean;
}) {
  const { theme } = useAppearance();
  const flow = useMobileBatchHandover(workflow, onConfirmed);
  return (
    <>
      <AppPageHeader
        title="Hand over multiple parcels"
        subtitle={
          workflow === 'receiver-cashier'
            ? 'Collect the amount due and use one OTP and one signature for the selection.'
            : 'Search by receiver telephone and use one OTP and one signature for the selection.'
        }
      />
      {flow.completedCount ? (
        <AppCard>
          <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.success }}>
            {flow.completedCount} parcels marked as received.
          </Text>
          <AppButton title="Done" onPress={onClose} />
        </AppCard>
      ) : (
        <>
          <AppButton
            title="Back to parcels"
            variant="plain"
            disabled={flow.busy}
            onPress={onClose}
          />
          {flow.error ? (
            <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
              {flow.error}
            </Text>
          ) : null}
          {flow.busy ? (
            <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.textMuted }}>
              Working…
            </Text>
          ) : null}
          {flow.session ? (
            <MobileBatchVerification
              key={flow.session.id}
              flow={flow}
              session={flow.session}
              whatsappAvailable={whatsappAvailable}
            />
          ) : (
            <MobileBatchSelection flow={flow} whatsappAvailable={whatsappAvailable} />
          )}
        </>
      )}
    </>
  );
}
