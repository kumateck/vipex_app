import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton } from '@mobile/components/ui';
import type { RiderDoorstepRecord } from '@mobile/types/parcels';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { CustomerSignaturePad } from '../components/customer-signature-pad';
import { RiderCollectionFields } from '../components/rider-collection-fields';
import type { DeliveryHandoverInput } from '../types';
import { getOutstandingDeliveryFeePsw, getOutstandingPrincipalPsw } from '../utils';

type Props = {
  delivery: RiderDoorstepRecord;
  busy: boolean;
  onClose: () => void;
  onConfirm: (input: DeliveryHandoverInput) => void;
};

function cedisInput(pesewas?: number) {
  return pesewas ? (pesewas / 100).toFixed(2) : '0.00';
}

export function DeliverySignatureDialog(props: Props) {
  const { theme } = useAppearance();
  const [signatureImage, setSignatureImage] = useState('');
  const [principal, setPrincipal] = useState(() =>
    cedisInput(getOutstandingPrincipalPsw(props.delivery)),
  );
  const [deliveryFee, setDeliveryFee] = useState(() =>
    cedisInput(getOutstandingDeliveryFeePsw(props.delivery)),
  );

  const principalAmountCedis = Number(principal || 0);
  const deliveryFeeAmountCedis = Number(deliveryFee || 0);
  const amountsValid =
    Number.isFinite(principalAmountCedis) &&
    Number.isFinite(deliveryFeeAmountCedis) &&
    principalAmountCedis >= 0 &&
    deliveryFeeAmountCedis >= 0;
  const canSubmit = Boolean(signatureImage) && amountsValid && !props.busy;

  const confirm = () => {
    if (!canSubmit) return;
    props.onConfirm({
      signatureImage,
      principalAmountCedis,
      deliveryFeeAmountCedis,
    });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={props.onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} />
        <View
          style={[styles.sheet, mobileShadow.modal, { backgroundColor: theme.colors.bgElevated }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: `${theme.colors.primary}18` }]}>
              <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Confirm customer handover
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]} numberOfLines={1}>
                {props.delivery.bookingCode} · {props.delivery.receiverName || 'Receiver'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close signature"
              disabled={props.busy}
              onPress={props.onClose}
              style={styles.close}
            >
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <RiderCollectionFields
              principal={principal}
              deliveryFee={deliveryFee}
              disabled={props.busy}
              onPrincipalChange={setPrincipal}
              onDeliveryFeeChange={setDeliveryFee}
            />
            <CustomerSignaturePad disabled={props.busy} onChange={setSignatureImage} />
            {!amountsValid ? (
              <Text style={[styles.error, { color: theme.colors.danger }]}>
                Enter valid payment amounts.
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <View style={styles.actionSecondary}>
              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={props.onClose}
                disabled={props.busy}
              />
            </View>
            <View style={styles.actionPrimary}>
              <AppButton
                title="Confirm handover"
                onPress={confirm}
                loading={props.busy}
                disabled={!canSubmit}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    maxHeight: '94%',
    borderTopLeftRadius: mobileRadius.xl,
    borderTopRightRadius: mobileRadius.xl,
    padding: mobileSpacing.lg,
    paddingBottom: mobileSpacing.xxl,
    gap: mobileSpacing.md,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#64748B',
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  icon: {
    width: 42,
    height: 42,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { ...mobileTextStyles.title3 },
  subtitle: { ...mobileTextStyles.caption1, marginTop: 2 },
  close: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  content: { gap: mobileSpacing.lg, paddingBottom: mobileSpacing.xs },
  error: { ...mobileTextStyles.footnote, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: mobileSpacing.sm },
  actionSecondary: { flex: 0.7 },
  actionPrimary: { flex: 1.3 },
});
