import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppButton, AppCard, AppInput, AppLabel } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileTextStyles } from '@mobile/theme/layout';
import type { MobileCustomer, MobileCustomerPatch } from '../../types';

type Props = {
  customer: MobileCustomer;
  canUpdate: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: (patch: MobileCustomerPatch) => Promise<void>;
};

export function MobileCustomerEditForm({ customer, canUpdate, saving, onBack, onSave }: Props) {
  const { theme } = useAppearance();
  const [fullname, setFullname] = useState(customer.fullname);
  const [telephone, setTelephone] = useState(customer.telephone ?? '');
  const [telephone2, setTelephone2] = useState(customer.telephone2 ?? '');
  const [address, setAddress] = useState(customer.address ?? '');
  const [email, setEmail] = useState(customer.email ?? '');
  const valid = fullname.trim().length > 0 && telephone.trim().length > 0;

  return (
    <>
      <AppCard>
        <Text style={[styles.title, { color: theme.colors.text }]}>{customer.fullname}</Text>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          {customer.customerType === 1 ? 'Business' : 'Individual'} customer
          {customer.creditEligible ? ' · Credit eligible' : ''}
        </Text>
        <AppLabel>Full name</AppLabel>
        <AppInput
          value={fullname}
          onChangeText={setFullname}
          editable={canUpdate}
          maxLength={255}
        />
        <AppLabel>Primary phone</AppLabel>
        <AppInput
          value={telephone}
          onChangeText={setTelephone}
          editable={canUpdate}
          keyboardType="phone-pad"
        />
        <AppLabel>Secondary phone</AppLabel>
        <AppInput
          value={telephone2}
          onChangeText={setTelephone2}
          editable={canUpdate}
          keyboardType="phone-pad"
        />
        <AppLabel>Email</AppLabel>
        <AppInput
          value={email}
          onChangeText={setEmail}
          editable={canUpdate}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppLabel>Address</AppLabel>
        <AppInput
          value={address}
          onChangeText={setAddress}
          editable={canUpdate}
          multiline
          maxLength={255}
        />
        {canUpdate ? (
          <AppButton
            title="Save contact details"
            loading={saving}
            disabled={!valid}
            onPress={() =>
              void onSave({
                id: customer.id,
                fullname: fullname.trim(),
                telephone: telephone.trim(),
                telephone2: telephone2.trim() || null,
                email: email.trim() || null,
                address: address.trim() || null,
              })
            }
          />
        ) : (
          <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
            Read-only. `CanUpdateCustomers` is required to edit contact details.
          </Text>
        )}
      </AppCard>
      <AppButton title="Back to customers" variant="plain" onPress={onBack} />
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title3 },
  text: { ...mobileTextStyles.subhead },
});
