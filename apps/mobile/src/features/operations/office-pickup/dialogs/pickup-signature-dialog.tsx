import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { MAX_HANDOVER_SIGNATURE_LENGTH } from '@/shared/shipments/handover-signature';
import { CustomerSignaturePad } from '@mobile/components/courier';
import { AppButton } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type Props = {
  collector: string;
  onClose: () => void;
  onSave: (signatureImage: string) => void;
};

export function PickupSignatureDialog({ collector, onClose, onSave }: Props) {
  const { theme } = useAppearance();
  const [draft, setDraft] = useState('');
  const tooLarge = draft.length > MAX_HANDOVER_SIGNATURE_LENGTH;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: theme.colors.bgElevated }]}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>{collector} signature</Text>
          <CustomerSignaturePad onChange={setDraft} />
          {tooLarge ? (
            <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.danger }}>
              Signature is too large. Clear it and sign again.
            </Text>
          ) : null}
          <View style={styles.actions}>
            <AppButton title="Cancel" variant="secondary" onPress={onClose} />
            <AppButton
              title="Save signature"
              disabled={!draft || tooLarge}
              onPress={() => onSave(draft)}
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
  dialog: {
    width: '100%',
    maxWidth: 520,
    gap: mobileSpacing.md,
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.md,
  },
  title: { ...mobileTextStyles.title3 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: mobileSpacing.sm },
});
