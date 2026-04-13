import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTypography } from '@mobile/theme/layout';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

type AppPageHeaderProps = {
  title: string;
  subtitle?: string;
};

type PasswordInputProps = Omit<
  React.ComponentProps<typeof TextInput>,
  'style' | 'placeholderTextColor' | 'secureTextEntry'
>;

export function AppCard({ children }: PropsWithChildren) {
  const { theme } = useAppearance();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function AppLabel({ children }: { children: ReactNode }) {
  const { theme } = useAppearance();
  return <Text style={[styles.label, { color: theme.colors.textMuted }]}>{children}</Text>;
}

export function AppInput(
  props: Omit<React.ComponentProps<typeof TextInput>, 'style' | 'placeholderTextColor'>,
) {
  const { theme } = useAppearance();
  return (
    <TextInput
      {...props}
      style={[
        styles.input,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.inputBg,
          color: theme.colors.inputText,
        },
      ]}
      placeholderTextColor={theme.colors.inputPlaceholder}
    />
  );
}

export function PasswordInput(props: PasswordInputProps) {
  const { theme } = useAppearance();
  const [hidden, setHidden] = useState(true);

  return (
    <View
      style={[
        styles.passwordWrap,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.inputBg,
        },
      ]}
    >
      <TextInput
        {...props}
        secureTextEntry={hidden}
        style={[styles.passwordInput, { color: theme.colors.inputText }]}
        placeholderTextColor={theme.colors.inputPlaceholder}
      />
      <Pressable
        onPress={() => setHidden((prev) => !prev)}
        style={({ pressed }) => [styles.passwordToggle, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={[styles.passwordToggleText, { color: theme.colors.textMuted }]}>
          {hidden ? 'Show' : 'Hide'}
        </Text>
      </Pressable>
    </View>
  );
}

export function AppButton({ title, onPress, disabled, variant = 'primary' }: AppButtonProps) {
  const { theme } = useAppearance();
  const primary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          backgroundColor: primary ? theme.colors.primary : theme.colors.cardMuted,
          borderColor: primary ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          { color: primary ? theme.colors.primaryText : theme.colors.text },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function AppPageHeader({ title, subtitle }: AppPageHeaderProps) {
  const { theme } = useAppearance();

  return (
    <View style={styles.pageHeader}>
      <Text style={[styles.pageTitle, { color: theme.colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.pageSubtitle, { color: theme.colors.textSubtle }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function AppSkeletonCard({ lines = 3 }: { lines?: number }) {
  const { theme } = useAppearance();
  const items = new Array(lines).fill(0);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      {items.map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonLine,
            {
              width: index === items.length - 1 ? '55%' : '100%',
              backgroundColor: theme.colors.cardMuted,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.md,
    gap: mobileSpacing.sm,
  },
  label: {
    fontSize: mobileTypography.label,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: 11,
    fontSize: 16,
  },
  passwordWrap: {
    borderWidth: 1,
    borderRadius: mobileRadius.md,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 11,
    paddingLeft: mobileSpacing.md,
    fontSize: 16,
  },
  passwordToggle: {
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm,
  },
  passwordToggleText: {
    fontSize: mobileTypography.label,
    fontWeight: '700',
  },
  button: {
    borderWidth: 1,
    borderRadius: mobileRadius.md,
    paddingVertical: 11,
    paddingHorizontal: mobileSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  pageHeader: {
    gap: 4,
    paddingTop: 2,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  pageSubtitle: {
    fontSize: mobileTypography.subtitle,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 999,
  },
});
