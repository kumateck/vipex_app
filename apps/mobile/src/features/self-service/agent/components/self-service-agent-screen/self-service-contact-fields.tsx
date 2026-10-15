import { StyleSheet, Text, View } from 'react-native';
import { AppInput, AppLabel } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { SelfServiceContactForm } from '../../utils';

type Props = {
  title: string;
  contact: SelfServiceContactForm;
  error: string | null;
  onChange: (field: keyof SelfServiceContactForm, value: string) => void;
};

export function SelfServiceContactFields({ title, contact, error, onChange }: Props) {
  const { theme } = useAppearance();
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <AppLabel>Full name</AppLabel>
      <AppInput
        value={contact.fullname}
        onChangeText={(value) => onChange('fullname', value)}
        maxLength={255}
        autoCapitalize="words"
      />
      <AppLabel>Phone</AppLabel>
      <AppInput
        value={contact.phone}
        onChangeText={(value) => onChange('phone', value)}
        keyboardType="phone-pad"
        placeholder="0241234567"
      />
      <AppLabel>Backup phone (optional)</AppLabel>
      <AppInput
        value={contact.phone2}
        onChangeText={(value) => onChange('phone2', value)}
        keyboardType="phone-pad"
        placeholder="0241234567"
      />
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: mobileSpacing.xs },
  title: { ...mobileTextStyles.headline },
  error: { ...mobileTextStyles.footnote },
});
