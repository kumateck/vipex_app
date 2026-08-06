import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTypography } from '@mobile/theme/layout';

type SignaturePadProps = {
  onChange: (signature: string) => void;
};

export function SignaturePad({ onChange }: SignaturePadProps) {
  const { theme } = useAppearance();
  const [value, setValue] = useState('');

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Receiver Signature (Optional)
      </Text>
      <View
        style={[
          styles.pad,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.cardMuted,
          },
        ]}
      >
        <Text style={{ color: theme.colors.textSubtle }}>
          Capture a typed acknowledgement when touch signature is unavailable.
        </Text>
        <AppInput
          value={value}
          onChangeText={(next) => {
            setValue(next);
            onChange(next.trim());
          }}
          placeholder="Type receiver name"
        />
      </View>
      <AppButton
        title="Clear Signature"
        variant="secondary"
        onPress={() => {
          setValue('');
          onChange('');
        }}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  pad: {
    borderWidth: 1,
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.md,
    gap: mobileSpacing.sm,
  },
});
