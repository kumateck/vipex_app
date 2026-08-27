import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppButton, AppCard, AppInput, AppLabel } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileTextStyles } from '@mobile/theme/layout';
import type { ParcelSearchRow } from '@mobile/types/parcels';

type Props = {
  parcel: ParcelSearchRow;
  saving: boolean;
  canCollect: boolean;
  onBack: () => void;
  onCall: () => void;
  onSave: (address: string, fee: string) => Promise<void>;
};

export function AddressCollectionForm(props: Props) {
  const { theme } = useAppearance();
  const [address, setAddress] = useState('');
  const [fee, setFee] = useState('');
  const valid = address.trim().length >= 3 && Number(fee) >= 0;
  return (
    <>
      <AppCard>
        <Text style={[styles.title, { color: theme.colors.text }]}>{props.parcel.bookingCode}</Text>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          Receiver: {props.parcel.receiverName ?? '-'} · {props.parcel.receiverPhone ?? '-'}
        </Text>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          {props.parcel.parcelDetails}
        </Text>
        <AppButton
          title="Call receiver"
          variant="secondary"
          disabled={!props.parcel.receiverPhone}
          onPress={props.onCall}
        />
      </AppCard>
      {props.canCollect ? (
        <AppCard>
          <AppLabel>Confirmed delivery address</AppLabel>
          <AppInput
            value={address}
            onChangeText={setAddress}
            multiline
            maxLength={255}
            placeholder="House number, street, landmark and area"
          />
          <AppLabel>Delivery fee (GHS)</AppLabel>
          <AppInput
            value={fee}
            onChangeText={setFee}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <AppButton
            title="Save address and fee"
            loading={props.saving}
            disabled={!valid}
            onPress={() => void props.onSave(address, fee)}
          />
        </AppCard>
      ) : (
        <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
          You can call the receiver, but `CanMarkDoorstepCalled` is required to save the address and
          fee.
        </Text>
      )}
      <AppButton title="Back to follow-up list" variant="plain" onPress={props.onBack} />
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title3 },
  text: { ...mobileTextStyles.subhead },
});
