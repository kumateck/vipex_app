import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppInput, AppLabel, AppSelectField } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CashierSessionType } from '../types';

type Props = {
  visible: boolean;
  busy: boolean;
  loadingTypes: boolean;
  error: string | null;
  sessionTypes: CashierSessionType[];
  onClose: () => void;
  onConfirm: (input: { sessionTypeId: string; openingBalanceCedis: number }) => void;
};

export function OpenCashierSessionDialog(props: Props) {
  const { theme } = useAppearance();
  const [sessionTypeId, setSessionTypeId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  useEffect(() => {
    if (!props.visible) {
      setSessionTypeId('');
      setOpeningBalance('');
    }
  }, [props.visible]);

  const options = props.sessionTypes.map((type) => ({ value: type.id, label: type.sessionType }));
  const openingBalanceCedis = openingBalance.trim() ? Number(openingBalance) : 0;

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} />
        <View
          style={[styles.sheet, mobileShadow.modal, { backgroundColor: theme.colors.bgElevated }]}
        >
          <View style={[styles.icon, { backgroundColor: `${theme.colors.primary}18` }]}>
            <Ionicons name="play-outline" size={25} color={theme.colors.primary} />
          </View>
          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Open cashier session</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Select your shift and confirm the cash available at the start.
            </Text>
          </View>
          <AppSelectField
            label="Session type"
            value={sessionTypeId}
            options={options}
            onValueChange={setSessionTypeId}
            placeholder="Select type"
            disabled={props.busy || props.loadingTypes}
            loading={props.loadingTypes}
          />
          <View style={styles.field}>
            <AppLabel>Opening balance (GHS)</AppLabel>
            <AppInput
              value={openingBalance}
              onChangeText={setOpeningBalance}
              placeholder="0.00"
              inputMode="decimal"
              keyboardType="decimal-pad"
              editable={!props.busy}
            />
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
              <AppButton
                title="Open Session"
                onPress={() => props.onConfirm({ sessionTypeId, openingBalanceCedis })}
                loading={props.busy}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.48)' },
  sheet: {
    borderTopLeftRadius: mobileRadius.xl,
    borderTopRightRadius: mobileRadius.xl,
    padding: mobileSpacing.xl,
    paddingBottom: mobileSpacing.xxl,
    gap: mobileSpacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { gap: 3 },
  title: { ...mobileTextStyles.title2 },
  subtitle: { ...mobileTextStyles.subhead },
  field: { gap: 6 },
  error: { ...mobileTextStyles.footnote, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: mobileSpacing.sm, marginTop: mobileSpacing.xs },
  action: { flex: 1 },
});
