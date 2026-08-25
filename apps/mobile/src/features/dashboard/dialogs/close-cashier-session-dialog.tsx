import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { formatMoneyPsw } from '../utils';

type Props = {
  visible: boolean;
  busy: boolean;
  error: string | null;
  expectedBalancePsw: number;
  onClose: () => void;
  onConfirm: () => void;
};

export function CloseCashierSessionDialog(props: Props) {
  const { theme } = useAppearance();
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} />
        <View
          style={[styles.card, mobileShadow.modal, { backgroundColor: theme.colors.bgElevated }]}
        >
          <View style={[styles.icon, { backgroundColor: `${theme.colors.danger}16` }]}>
            <Ionicons name="stop-circle-outline" size={28} color={theme.colors.danger} />
          </View>
          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Close cashier session?</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              This ends the active session. The expected amount is calculated from the same live
              totals used on desktop.
            </Text>
          </View>
          <View style={[styles.total, { backgroundColor: theme.colors.cardMuted }]}>
            <Text style={[styles.totalLabel, { color: theme.colors.textMuted }]}>
              EXPECTED TOTAL RECEIVED
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.totalValue, { color: theme.colors.text }]}
            >
              {formatMoneyPsw(props.expectedBalancePsw)}
            </Text>
          </View>
          {props.error ? (
            <Text style={[styles.error, { color: theme.colors.danger }]}>{props.error}</Text>
          ) : null}
          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={props.onClose}
                disabled={props.busy}
              />
            </View>
            <View style={styles.action}>
              <AppButton title="Close Session" onPress={props.onConfirm} loading={props.busy} />
            </View>
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
    padding: mobileSpacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    borderRadius: mobileRadius.xl,
    padding: mobileSpacing.xl,
    gap: mobileSpacing.md,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { gap: 4 },
  title: { ...mobileTextStyles.title2 },
  subtitle: { ...mobileTextStyles.subhead },
  total: { borderRadius: mobileRadius.md, padding: mobileSpacing.lg, gap: 3 },
  totalLabel: { ...mobileTextStyles.eyebrow },
  totalValue: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  error: { ...mobileTextStyles.footnote, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: mobileSpacing.sm },
  action: { flex: 1 },
});
