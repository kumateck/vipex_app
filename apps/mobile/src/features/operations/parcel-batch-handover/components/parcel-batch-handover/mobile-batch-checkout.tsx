import { useState } from 'react';
import { Text } from 'react-native';
import { AppButton, AppSelectField } from '@mobile/components/ui/mobile';
import { PickupSignatureDialog } from '@mobile/features/operations/office-pickup/dialogs';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { isReceiverCashierSignature } from '@/shared/shipments/receiver-cashier-signature';
import {
  BATCH_PAYMENT_METHODS,
  type BatchPaymentMethod,
} from '@/shared/shipments/parcel-batch-handover';
import type { useMobileBatchHandover } from '../../hooks';

const PAYMENT_OPTIONS = [...BATCH_PAYMENT_METHODS];

export function MobileBatchCheckout({ flow }: { flow: ReturnType<typeof useMobileBatchHandover> }) {
  const { theme } = useAppearance();
  const [signing, setSigning] = useState(false);
  const signed = flow.signature && isReceiverCashierSignature(flow.signature);
  return (
    <>
      <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.success }}>
        OTP verified for {flow.telephone}.
      </Text>
      {flow.totalPsw > 0 ? (
        <AppSelectField
          label="Payment method"
          value={flow.paymentMethod}
          options={PAYMENT_OPTIONS}
          onValueChange={(value) => flow.setPaymentMethod(value as BatchPaymentMethod)}
          disabled={flow.busy}
        />
      ) : null}
      {signed ? (
        <Text style={{ color: theme.colors.text }}>
          Signature captured for all selected parcels.
        </Text>
      ) : null}
      {flow.signature && !signed ? (
        <Text style={{ color: theme.colors.danger }}>Capture a new signature.</Text>
      ) : null}
      <AppButton
        title={signed ? 'Sign again' : 'Capture one signature'}
        variant="secondary"
        disabled={flow.busy}
        onPress={() => setSigning(true)}
      />
      <AppButton
        title={
          flow.totalPsw > 0
            ? `Confirm payment and hand over ${flow.selected.length} parcels`
            : `Confirm received · ${flow.selected.length} parcels`
        }
        disabled={flow.busy || !signed}
        onPress={() => void flow.confirm()}
      />
      {signing ? (
        <PickupSignatureDialog
          collector="Receiver"
          onClose={() => setSigning(false)}
          onSave={(signatureImage) => {
            flow.setSignature({ source: 'touchscreen', signatureImage });
            setSigning(false);
          }}
        />
      ) : null}
    </>
  );
}
