import { memo, useMemo } from 'react';
import { Text } from 'react-native';
import { AppInput, AppSelectField } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { CardMode, CardSelection, PickupCardOption, PickupCustomerCard } from '../../types';
import { PickupChoiceChips } from './pickup-choice-chips';
import { pickupStyles } from './office-pickup.styles';

type Props = {
  label: string;
  value: CardSelection;
  onChange: (next: CardSelection) => void;
  receiverCards: PickupCustomerCard[];
  cardOptions: PickupCardOption[];
  disabled?: boolean;
};

/** "No card / existing card / new card" choice for one receiver, as on web. */
export const PickupCardFields = memo(function PickupCardFields({
  label,
  value,
  onChange,
  receiverCards,
  cardOptions,
  disabled,
}: Props) {
  const { theme } = useAppearance();
  const existingOptions = useMemo(
    () =>
      receiverCards.map((card) => ({
        value: card.id,
        label: `${card.cardName} - ${card.cardNumber}`,
      })),
    [receiverCards],
  );
  const typeOptions = useMemo(
    () => cardOptions.map((option) => ({ value: option.id, label: option.name })),
    [cardOptions],
  );
  const modeOptions = useMemo(
    () => [
      { value: 'none' as CardMode, label: 'No card' },
      {
        value: 'existing' as CardMode,
        label: 'Existing card',
        disabled: receiverCards.length === 0,
      },
      { value: 'new' as CardMode, label: 'New card' },
    ],
    [receiverCards.length],
  );

  return (
    <>
      <PickupChoiceChips
        label={label}
        value={value.mode}
        options={modeOptions}
        disabled={disabled}
        onChange={(mode) => onChange({ ...value, mode })}
      />
      {value.mode === 'existing' ? (
        <AppSelectField
          label="Card on file"
          value={value.existingRecordId}
          options={existingOptions}
          disabled={disabled}
          placeholder="Select card"
          onValueChange={(existingRecordId) => onChange({ ...value, existingRecordId })}
        />
      ) : null}
      {value.mode === 'new' ? (
        <>
          <AppSelectField
            label="Card type"
            value={value.newCardTypeId}
            options={typeOptions}
            disabled={disabled}
            placeholder="Select card type"
            onValueChange={(newCardTypeId) => onChange({ ...value, newCardTypeId })}
          />
          <AppInput
            value={value.newCardNumber}
            editable={!disabled}
            autoCapitalize="characters"
            placeholder="Card number"
            onChangeText={(newCardNumber) => onChange({ ...value, newCardNumber })}
          />
        </>
      ) : null}
      {value.mode === 'none' ? (
        <Text style={[pickupStyles.hint, { color: theme.colors.textSubtle }]}>
          No ID card will be recorded for this receiver.
        </Text>
      ) : null}
    </>
  );
});
