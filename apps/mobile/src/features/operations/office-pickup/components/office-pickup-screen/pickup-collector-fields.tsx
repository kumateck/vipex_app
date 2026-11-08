import { memo } from 'react';
import { Text } from 'react-native';
import { limitPhoneDigits, PHONE_DIGITS } from '@/lib/phone';
import { AppCard, AppInput } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { PickupHandoverForm } from '../../hooks';
import type { HandoverTarget, PickupCardOption, PickupCustomerCard } from '../../types';
import { PickupCardFields } from './pickup-card-fields';
import { PickupChoiceChips } from './pickup-choice-chips';
import { pickupStyles } from './office-pickup.styles';

const TARGET_OPTIONS = [
  { value: 'main' as HandoverTarget, label: 'Main receiver' },
  { value: 'second' as HandoverTarget, label: 'Second receiver' },
];

type Props = {
  form: PickupHandoverForm;
  hasLinkedSecondReceiver: boolean;
  secondReceiverCards: PickupCustomerCard[];
  cardOptions: PickupCardOption[];
  disabled: boolean;
};

/** "Who collected the parcel", with the second receiver's details and card. */
export const PickupCollectorFields = memo(function PickupCollectorFields({
  form,
  hasLinkedSecondReceiver,
  secondReceiverCards,
  cardOptions,
  disabled,
}: Props) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <PickupChoiceChips
        label="Who collected the parcel"
        value={form.handoverTarget}
        options={TARGET_OPTIONS}
        disabled={disabled}
        onChange={form.setHandoverTarget}
      />
      {form.handoverTarget === 'second' ? (
        <>
          {hasLinkedSecondReceiver ? (
            <Text style={[pickupStyles.hint, { color: theme.colors.textMuted }]}>
              Using the second receiver linked to this parcel.
            </Text>
          ) : (
            <>
              <AppInput
                value={form.secondNewName}
                editable={!disabled}
                placeholder="Second receiver full name"
                onChangeText={form.setSecondNewName}
              />
              <AppInput
                value={form.secondNewPhone}
                editable={!disabled}
                placeholder="Second receiver telephone"
                keyboardType="phone-pad"
                maxLength={PHONE_DIGITS}
                onChangeText={(value) => form.setSecondNewPhone(limitPhoneDigits(value))}
              />
            </>
          )}
          <PickupCardFields
            label="Second receiver ID card"
            value={form.secondCard}
            onChange={form.setSecondCard}
            receiverCards={secondReceiverCards}
            cardOptions={cardOptions}
            disabled={disabled}
          />
        </>
      ) : null}
    </AppCard>
  );
});
