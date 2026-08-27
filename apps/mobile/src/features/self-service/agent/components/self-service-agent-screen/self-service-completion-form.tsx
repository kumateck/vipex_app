import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppCard,
  AppInput,
  AppLabel,
  AppSelectField,
} from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CompleteSelfServiceDraftInput, SelfServiceDraft } from '../../types';

type Props = {
  draft: SelfServiceDraft;
  saving: boolean;
  canComplete: boolean;
  onBack: () => void;
  onClaim: () => Promise<void>;
  onComplete: (input: CompleteSelfServiceDraftInput) => Promise<unknown>;
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
}: Props) {
  const { theme } = useAppearance();
  const [parcelDetails, setParcelDetails] = useState(draft.parcelContent);
  const [chargeCedis, setChargeCedis] = useState('');
  const [paymentResponsibility, setPaymentResponsibility] = useState<
    'SENDER' | 'RECEIVER' | 'SPLIT'
  >('SENDER');
  const [senderPartialPaymentCedis, setSenderPartialPaymentCedis] = useState('');
  const destinationId = draft.destinationBranchId ?? '';
  const valid = destinationId && parcelDetails.trim() && Number(chargeCedis) >= 0;

  return (
    <>
      <AppCard>
        <Text style={[styles.title, { color: theme.colors.text }]}>Complete booking</Text>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          Sender: {draft.senderFullname} · {draft.senderPhone}
        </Text>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          Receiver: {draft.receiverFullname} · {draft.receiverPhone}
        </Text>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          Declared value: GHS {(draft.parcelValuePsw / 100).toFixed(2)}
        </Text>
      </AppCard>

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
            onPress={() =>
              void onComplete({
                id: draft.id,
                destinationId,
                pickupLocationId: draft.destinationLocationId,
                parcelDetails: parcelDetails.trim(),
                chargeCedis,
                paymentResponsibility,
                senderSettlementMode: 'PAY_NOW',
                senderPartialPaymentCedis:
                  paymentResponsibility === 'SPLIT' ? senderPartialPaymentCedis : null,
              })
            }
          />
        </AppCard>
      )}
      <AppButton title="Back to drafts" variant="plain" onPress={onBack} />
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title3 },
  text: { ...mobileTextStyles.subhead },
  spacer: { marginTop: mobileSpacing.xs },
});
