import { Modal, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput, AppLabel } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type CloseConsignmentExceptionsDialogProps = {
  busy: boolean;
  missingCount: number;
  reason: string;
  visible: boolean;
  onChangeReason: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function CloseConsignmentExceptionsDialog({
  busy,
  missingCount,
  reason,
  visible,
  onChangeReason,
  onClose,
  onConfirm,
}: CloseConsignmentExceptionsDialogProps) {
  const { theme } = useAppearance();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Close with missing parcels?
          </Text>
          <Text style={[styles.helper, { color: theme.colors.textSubtle }]}>
            {missingCount} parcel{missingCount === 1 ? '' : 's'} not yet arrived. Closing now will
            flag {missingCount === 1 ? 'it' : 'them'} as a discrepancy. A reason is required.
          </Text>
          <AppLabel>Reason</AppLabel>
          <AppInput
            value={reason}
            onChangeText={onChangeReason}
            placeholder="e.g. Truck left before remaining boxes were unloaded"
            multiline
            numberOfLines={4}
          />
          <View style={styles.actions}>
            <AppButton title="Cancel" variant="secondary" onPress={onClose} disabled={busy} />
            <AppButton
              title={busy ? 'Closing...' : 'Close with exceptions'}
              onPress={onConfirm}
              disabled={busy}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: mobileSpacing.lg,
  },
  card: {
    width: '100%',
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.md,
    gap: mobileSpacing.sm,
  },
  title: { ...mobileTextStyles.headline },
  helper: { ...mobileTextStyles.subhead },
  actions: { flexDirection: 'row', gap: mobileSpacing.sm, marginTop: mobileSpacing.sm },
});
