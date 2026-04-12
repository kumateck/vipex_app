import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing } from '@mobile/theme/layout';

type PasswordInputProps = Omit<
  React.ComponentProps<typeof TextInput>,
  'secureTextEntry' | 'style' | 'placeholderTextColor'
>;

export function PasswordInput(props: PasswordInputProps) {
  const { theme } = useAppearance();
  const [visible, setVisible] = useState(false);

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.inputBg,
        },
      ]}
    >
      <TextInput
        {...props}
        secureTextEntry={!visible}
        style={[styles.input, { color: theme.colors.inputText }]}
        placeholderTextColor={theme.colors.inputPlaceholder}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        onPress={() => setVisible((prev) => !prev)}
        hitSlop={8}
        style={styles.toggle}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={18}
          color={theme.colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderRadius: mobileRadius.md,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: mobileSpacing.md,
    paddingRight: mobileSpacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 16,
  },
  toggle: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
