import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppInput, AppLabel } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { RiderDeliveryChangeInput, RiderDeliveryChangeTarget } from '../types';

type Props = {
  target: RiderDeliveryChangeTarget;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: RiderDeliveryChangeInput) => void;
};

export function DeliveryChangeRequestDialog({ target, busy, onClose, onSubmit }: Props) {
  const { theme } = useAppearance();
  const [address, setAddress] = useState(target.dropoffAddress ?? '');
  const [fee, setFee] = useState(((target.deliveryFeePsw ?? 0) / 100).toFixed(2));
  const [reason, setReason] = useState('');
  const feeNumber = Number(fee);
  const valid =
    address.trim().length >= 3 &&
    reason.trim().length >= 3 &&
    fee.trim().length > 0 &&
    Number.isFinite(feeNumber) &&
    feeNumber >= 0;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[styles.sheet, mobileShadow.modal, { backgroundColor: theme.colors.bgElevated }]}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Request delivery change
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
                {target.bookingCode} · approval required before handover
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <View style={styles.field}>
              <AppLabel>New delivery address</AppLabel>
              <AppInput value={address} onChangeText={setAddress} editable={!busy} multiline />
            </View>
            <View style={styles.field}>
              <AppLabel>New delivery fee (GHS)</AppLabel>
              <AppInput
                value={fee}
                onChangeText={setFee}
                editable={!busy}
                inputMode="decimal"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.field}>
              <AppLabel>Reason for change</AppLabel>
              <AppInput
                value={reason}
                onChangeText={setReason}
                editable={!busy}
                multiline
                placeholder="Customer is now at a different location"
              />
            </View>
            <View style={[styles.note, { backgroundColor: `${theme.colors.primary}12` }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.noteText, { color: theme.colors.textMuted }]}>
                You cannot confirm this delivery while the request is pending.
              </Text>
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton title="Cancel" variant="secondary" onPress={onClose} disabled={busy} />
            </View>
            <View style={styles.action}>
              <AppButton
                title="Send request"
                loading={busy}
                disabled={!valid || busy}
                onPress={() =>
                  onSubmit({
                    requestedDropoffAddress: address.trim(),
                    requestedDeliveryFeeCedis: fee,
                    reason: reason.trim(),
                  })
                }
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: mobileRadius.xl,
    borderTopRightRadius: mobileRadius.xl,
    padding: mobileSpacing.lg,
    paddingBottom: mobileSpacing.xxl,
    gap: mobileSpacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.md },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { ...mobileTextStyles.title3 },
  subtitle: { ...mobileTextStyles.caption1, marginTop: 2 },
  form: { gap: mobileSpacing.md },
  field: { gap: 6 },
  note: {
    flexDirection: 'row',
    gap: mobileSpacing.xs,
    borderRadius: mobileRadius.md,
    padding: mobileSpacing.sm,
  },
  noteText: { ...mobileTextStyles.caption1, flex: 1 },
  actions: { flexDirection: 'row', gap: mobileSpacing.sm },
  action: { flex: 1 },
});
