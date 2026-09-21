import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppInput, AppLabel } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import type { ContactOutcome } from '../types';
import { PHONE_DIGITS } from '../utils';

type Props = {
  parcel: ParcelSearchRow | null;
  outcome: ContactOutcome;
  useSecondReceiver: boolean;
  secondReceiverName: string;
  secondReceiverPhone: string;
  sendSms: boolean;
  sendEmail: boolean;
  saving: boolean;
  onOutcomeChange: (value: ContactOutcome) => void;
  onUseSecondReceiverChange: (value: boolean) => void;
  onSecondReceiverNameChange: (value: string) => void;
  onSecondReceiverPhoneChange: (value: string) => void;
  onSendSmsChange: (value: boolean) => void;
  onSendEmailChange: (value: boolean) => void;
  onCall: () => void;
  onClose: () => void;
  onSave: () => void;
};

const OUTCOMES: Array<{ value: ContactOutcome; label: string }> = [
  { value: 'follow_up', label: 'Customer will get back' },
  { value: 'pickup', label: 'Customer will come (Awaiting Pickup)' },
  { value: 'delivery', label: 'Customer wants delivery' },
];

export function CallOutcomeDialog(props: Props) {
  const { theme } = useAppearance();
  return (
    <Modal
      visible={Boolean(props.parcel)}
      transparent
      animationType="slide"
      onRequestClose={props.onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} />
        <View
          style={[styles.sheet, mobileShadow.modal, { backgroundColor: theme.colors.bgElevated }]}
        >
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Call Outcome</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                Booking: {props.parcel?.bookingCode ?? ''}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close call outcome"
              hitSlop={10}
              disabled={props.saving}
              onPress={props.onClose}
            >
              <Ionicons name="close" size={26} color={theme.colors.textSubtle} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <AppButton
              title={props.parcel?.receiverPhone ? 'Call receiver' : 'Receiver phone unavailable'}
              variant="secondary"
              disabled={!props.parcel?.receiverPhone || props.saving}
              onPress={props.onCall}
            />

            <View style={styles.section}>
              <AppLabel>Outcome</AppLabel>
              {OUTCOMES.map((item) => {
                const selected = item.value === props.outcome;
                return (
                  <Pressable
                    key={item.value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    disabled={props.saving}
                    onPress={() => props.onOutcomeChange(item.value)}
                    style={[
                      styles.outcome,
                      {
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: selected ? theme.colors.primary : theme.colors.inputBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.outcomeText,
                        { color: selected ? theme.colors.primaryText : theme.colors.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {props.outcome === 'pickup' ? (
              <View style={[styles.panel, { borderColor: theme.colors.border }]}>
                <ToggleRow
                  label="Use second receiver"
                  value={props.useSecondReceiver}
                  disabled={props.saving}
                  onChange={props.onUseSecondReceiverChange}
                />
                {props.useSecondReceiver ? (
                  <View style={styles.fields}>
                    <AppLabel>Second receiver name</AppLabel>
                    <AppInput
                      value={props.secondReceiverName}
                      onChangeText={props.onSecondReceiverNameChange}
                      placeholder="Full name"
                      editable={!props.saving}
                    />
                    <AppLabel>Second receiver telephone</AppLabel>
                    <AppInput
                      value={props.secondReceiverPhone}
                      onChangeText={props.onSecondReceiverPhoneChange}
                      placeholder="10-digit telephone"
                      keyboardType="number-pad"
                      maxLength={PHONE_DIGITS}
                      editable={!props.saving}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={[styles.panel, { borderColor: theme.colors.border }]}>
              <Text style={[styles.panelTitle, { color: theme.colors.text }]}>
                Send Notification
              </Text>
              <ToggleRow
                label="Send SMS"
                value={props.sendSms}
                disabled={props.saving}
                onChange={props.onSendSmsChange}
              />
              <ToggleRow
                label="Send Email"
                value={props.sendEmail}
                disabled={props.saving}
                onChange={props.onSendEmailChange}
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton
                title="Cancel"
                variant="secondary"
                disabled={props.saving}
                onPress={props.onClose}
              />
            </View>
            <View style={styles.action}>
              <AppButton title="Save Outcome" loading={props.saving} onPress={props.onSave} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ToggleRow(props: {
  label: string;
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  const { theme } = useAppearance();
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>{props.label}</Text>
      <Switch value={props.value} disabled={props.disabled} onValueChange={props.onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.52)' },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: mobileRadius.xl,
    borderTopRightRadius: mobileRadius.xl,
    padding: mobileSpacing.xl,
    paddingBottom: mobileSpacing.xxl,
    gap: mobileSpacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.md },
  heading: { flex: 1, gap: 3 },
  title: { ...mobileTextStyles.title1 },
  subtitle: { ...mobileTextStyles.body },
  content: { gap: mobileSpacing.lg, paddingBottom: mobileSpacing.sm },
  section: { gap: mobileSpacing.sm },
  outcome: {
    minHeight: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: mobileSpacing.md,
  },
  outcomeText: { ...mobileTextStyles.headline, textAlign: 'center' },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.md,
    padding: mobileSpacing.md,
    gap: mobileSpacing.sm,
  },
  panelTitle: { ...mobileTextStyles.headline },
  toggleRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.md,
  },
  toggleLabel: { ...mobileTextStyles.body, fontWeight: '600' },
  fields: { gap: mobileSpacing.sm },
  actions: { flexDirection: 'row', gap: mobileSpacing.sm },
  action: { flex: 1 },
});
