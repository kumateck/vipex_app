import { StyleSheet, Switch, Text, View } from 'react-native';
import {
  AppButton,
  AppCard,
  AppInput,
  AppLabel,
  AppSelectField,
} from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type {
  CompleteSelfServiceDraftInput,
  SelfServiceDraft,
  UpdateSelfServiceDraftInput,
} from '../../types';
import { useSelfServiceCompletionForm } from '../../hooks';
import { ParcelChargeAgentField } from '@mobile/features/parcel-create/components/parcel-create-screen';
import { SelfServiceDraftSummary } from './self-service-draft-summary';

type Props = {
  draft: SelfServiceDraft;
  saving: boolean;
  canComplete: boolean;
  onBack: () => void;
  onClaim: () => Promise<void>;
  onComplete: (input: CompleteSelfServiceDraftInput) => Promise<unknown>;
  onUpdateDraft: (input: UpdateSelfServiceDraftInput) => Promise<boolean>;
};

const PAYMENT_OPTIONS = [
  { value: 'SENDER', label: 'Sender pays' },
  { value: 'RECEIVER', label: 'Receiver pays' },
  { value: 'SPLIT', label: 'Split payment' },
];

export function SelfServiceCompletionForm({
  draft,
  saving,
  canComplete,
  onBack,
  onClaim,
  onComplete,
  onUpdateDraft,
}: Props) {
  const { theme } = useAppearance();
  const {
    parcelDetails,
    setParcelDetails,
    chargeCedis,
    setChargeCedis,
    paymentResponsibility,
    setPaymentResponsibility,
    senderPartialPaymentCedis,
    setSenderPartialPaymentCedis,
    callSender,
    setCallSender,
    valid,
    submit,
    chargeAgent,
  } = useSelfServiceCompletionForm(draft, canComplete, onComplete);

  return (
    <>
      <SelfServiceDraftSummary
        draft={draft}
        saving={saving}
        canEdit={canComplete && Boolean(draft.claimedBy)}
        onUpdateDraft={onUpdateDraft}
      />

      {!canComplete ? (
        <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
          Read-only. `CanCompleteSelfServiceBookings` is required to claim or complete this draft.
        </Text>
      ) : !draft.claimedBy ? (
        <AppCard>
          <Text style={[styles.text, { color: theme.colors.textMuted }]}>
            Claim this draft before entering the authoritative charge and payment responsibility.
          </Text>
          <AppButton title="Claim draft" loading={saving} onPress={() => void onClaim()} />
        </AppCard>
      ) : (
        <AppCard>
          <AppLabel>Parcel details</AppLabel>
          <AppInput
            value={parcelDetails}
            onChangeText={setParcelDetails}
            multiline
            maxLength={255}
          />
          <AppLabel>Charge (GHS)</AppLabel>
          <AppInput
            value={chargeCedis}
            onChangeText={setChargeCedis}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <ParcelChargeAgentField {...chargeAgent} />
          <View style={styles.callSenderRow}>
            <View style={styles.callSenderText}>
              <AppLabel>CS — Call Sender before deliver to Receiver</AppLabel>
              <Text style={[styles.text, { color: theme.colors.textMuted }]}>
                Turn on if the sender asked to be called before the receiver gets the parcel. CS is
                marked on the sticker.
              </Text>
            </View>
            <Switch value={callSender} onValueChange={setCallSender} />
          </View>
          <AppSelectField
            label="Payment responsibility"
            value={paymentResponsibility}
            options={PAYMENT_OPTIONS}
            onValueChange={(value) =>
              setPaymentResponsibility(value as typeof paymentResponsibility)
            }
          />
          {paymentResponsibility === 'SPLIT' ? (
            <View>
              <AppLabel>Sender partial payment (GHS)</AppLabel>
              <AppInput
                value={senderPartialPaymentCedis}
                onChangeText={setSenderPartialPaymentCedis}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>
          ) : null}
          <AppButton
            title="Complete booking"
            loading={saving}
            disabled={!valid}
            onPress={() => void submit()}
          />
        </AppCard>
      )}
      <AppButton title="Back to drafts" variant="plain" onPress={onBack} />
    </>
  );
}

const styles = StyleSheet.create({
  text: { ...mobileTextStyles.subhead },
  spacer: { marginTop: mobileSpacing.xs },
  callSenderRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  callSenderText: { flex: 1 },
});
