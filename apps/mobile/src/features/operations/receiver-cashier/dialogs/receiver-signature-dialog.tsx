import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { CustomerSignaturePad } from '@mobile/components/courier';
import { AppButton } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { isReceiverCashierSignature } from '@/shared/shipments/receiver-cashier-signature';
import type { ParcelReceivingOffice } from '@/shared/shipments/receiving-office';
import { PickupOfficeText } from '@mobile/features/operations/parcel-receiving-office';

type Props = {
  collector: string;
  trackingCode: string;
  pickup: ParcelReceivingOffice;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (signature: string) => void;
};

export function ReceiverSignatureDialog({
  collector,
  trackingCode,
  pickup,
  busy,
  error,
  onClose,
  onSave,
}: Props) {
  const { theme } = useAppearance();
  const [drawing, setDrawing] = useState('');
  const usable = isReceiverCashierSignature({ source: 'touchscreen', signatureImage: drawing });
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: theme.colors.bgElevated }]}
        >
          <Text style={[mobileTextStyles.title3, { color: theme.colors.text }]}>
            Signature for {trackingCode}
          </Text>
          <PickupOfficeText
            location={pickup.pickupLocationName}
            office={pickup.receivingOfficeName}
            style={{ color: theme.colors.textMuted }}
          />
          <Text style={{ color: theme.colors.textMuted }}>
            {collector}, sign to acknowledge receipt of this parcel.
          </Text>
          <CustomerSignaturePad disabled={busy} onChange={setDrawing} />
          {drawing && !usable ? (
            <Text style={{ color: theme.colors.danger }}>
              Clear the pad and draw your signature again.
            </Text>
          ) : null}
          {error ? (
            <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.danger }}>
              {error}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <AppButton title="Cancel" variant="secondary" disabled={busy} onPress={onClose} />
            <AppButton
              title={busy ? 'Saving…' : 'Save signature'}
              disabled={!usable || busy}
              onPress={() => onSave(drawing)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mobileSpacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    padding: mobileSpacing.md,
    gap: mobileSpacing.md,
    borderRadius: mobileRadius.lg,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: mobileSpacing.sm },
});
