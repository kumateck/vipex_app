import { Text } from 'react-native';
import { AppButton } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { OfficePickupHandover } from '../../hooks';
import { PickupOtpExceptionSection } from './pickup-otp-exception-section';
import { PickupSignatureSection } from './pickup-signature-section';
import { pickupStyles } from './office-pickup.styles';

export function PickupHandoverActions({ handover }: { handover: OfficePickupHandover }) {
  const { form, saving } = handover;
  const { theme } = useAppearance();
  const muted = { color: theme.colors.textMuted };
  const collector = form.handoverTarget === 'second' ? 'Second receiver' : 'Main receiver';
  return (
    <>
      {handover.showOtpException ? (
        <PickupOtpExceptionSection approval={handover.approval} disabled={handover.saving} />
      ) : null}
      <PickupSignatureSection
        collector={collector}
        signed={Boolean(form.signatureImage)}
        disabled={saving}
        onSign={form.setSignatureImage}
      />
      <AppButton
        title={
          saving
            ? 'Processing…'
            : handover.showOtpException && handover.approval.approval
              ? 'Confirm with admin approval'
              : 'Confirm delivered'
        }
        loading={saving}
        disabled={saving || Boolean(handover.confirmBlocker)}
        onPress={() => void handover.confirm()}
      />
      {handover.confirmBlocker ? (
        <Text style={[pickupStyles.hint, muted]}>{handover.confirmBlocker}</Text>
      ) : null}
      <AppButton
        title="Request home delivery"
        variant="secondary"
        disabled={saving}
        onPress={() => void handover.requestHomeDelivery()}
      />
    </>
  );
}
