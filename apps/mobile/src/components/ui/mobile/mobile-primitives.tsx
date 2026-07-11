import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type AppButtonVariant = 'primary' | 'secondary' | 'tinted' | 'plain';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: AppButtonVariant;
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
        mobileShadow.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
          borderWidth: theme.scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function AppLabel({ children }: { children: ReactNode }) {
  const { theme } = useAppearance();
  return <Text style={[styles.label, { color: theme.colors.textSubtle }]}>{children}</Text>;
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
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
        style={({ pressed }) => [styles.passwordToggle, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons
          name={hidden ? 'eye-outline' : 'eye-off-outline'}
          size={19}
          color={theme.colors.textSubtle}
        />
      </Pressable>
    </View>
  );
}

export function AppButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: AppButtonProps) {
  const { theme } = useAppearance();
  const isDisabled = disabled || loading;

  const variantStyle = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: 'transparent',
      textColor: theme.colors.primaryText,
      shadow: true,
    },
    secondary: {
      backgroundColor: theme.colors.cardMuted,
      borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
      textColor: theme.colors.text,
      shadow: false,
    },
    tinted: {
      backgroundColor: `${theme.colors.secondary}26`,
      borderColor: 'transparent',
      textColor: theme.colors.secondary,
      shadow: false,
    },
    plain: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: theme.colors.secondary,
      shadow: false,
    },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'plain' && styles.buttonPlain,
        variantStyle.shadow ? mobileShadow.card : null,
        {
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          borderWidth: variantStyle.borderColor === 'transparent' ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: variantStyle.textColor }]}>{title}</Text>
      )}
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
        mobileShadow.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
          borderWidth: theme.scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
        },
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
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.lg,
    gap: mobileSpacing.sm,
  },
  label: {
    ...mobileTextStyles.eyebrow,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: 13,
    fontSize: 16,
  },
  passwordWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.md,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    paddingLeft: mobileSpacing.md,
    fontSize: 16,
  },
  passwordToggle: {
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm,
  },
  button: {
    borderRadius: mobileRadius.md,
    paddingVertical: 13,
    paddingHorizontal: mobileSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPlain: {
    minHeight: 36,
    paddingVertical: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pageHeader: {
    gap: 4,
    paddingTop: 2,
  },
  pageTitle: {
    ...mobileTextStyles.largeTitle,
  },
  pageSubtitle: {
    ...mobileTextStyles.subhead,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 999,
  },
});
