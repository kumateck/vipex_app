import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getParcelStatusLabel } from '@mobile/constants/parcel-status';
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
export function AppStatusChip({ label }: { label: string | number }) {
  const rawLabel = String(label).trim();
  const numericStatus = /^\d+$/.test(rawLabel) ? Number.parseInt(rawLabel, 10) : null;
  const normalizedLabel = numericStatus === null ? rawLabel : getParcelStatusLabel(numericStatus);
  const { theme } = useAppearance();
  const normalized = normalizedLabel.toLowerCase();
  const isNumericStatus = numericStatus !== null;
  const numericIsSuccess = isNumericStatus && [6, 7].includes(numericStatus);
  const numericIsWarn = isNumericStatus && [0, 1, 2, 3, 4, 5].includes(numericStatus);
  const numericIsError = isNumericStatus && !numericIsSuccess && !numericIsWarn;
  const isGood =
    numericIsSuccess ||
    normalized.includes('arrived') ||
    normalized.includes('delivered') ||
    normalized.includes('paid');
  const isWarn =
    numericIsWarn ||
    normalized.includes('pending') ||
    normalized.includes('transit') ||
    normalized.includes('awaiting');
  const isError =
    numericIsError ||
    normalized.includes('failed') ||
    normalized.includes('cancel') ||
    normalized.includes('error');
  const icon = isGood ? '✓' : isWarn ? '⏳' : isError ? '!' : '•';
  const fg = isGood
    ? theme.colors.success
    : isWarn
      ? '#b37a00'
      : isError
        ? theme.colors.danger
        : theme.colors.textMuted;
  const bg = isGood
    ? theme.scheme === 'dark'
      ? '#0f2a1a'
      : '#ecfdf3'
    : isWarn
      ? theme.scheme === 'dark'
        ? '#2b1f08'
        : '#fff7e6'
      : isError
        ? theme.scheme === 'dark'
          ? '#2f1212'
          : '#fdecec'
        : theme.colors.cardMuted;
  return (
    <View style={[styles.statusChip, { backgroundColor: bg, borderColor: theme.colors.border }]}>
      <Text style={[styles.statusChipText, { color: fg }]}>
        {icon} {normalizedLabel}
      </Text>
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
export function MobileNoAccess({
  title = 'Access Denied',
  message = 'You do not have permission to view this section.',
}: {
  title?: string;
  message?: string;
}) {
  const { theme } = useAppearance();
  return (
    <View style={styles.noAccessWrap}>
      <View
        style={[
          styles.noAccessCard,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
        ]}
      >
        <Text style={[styles.noAccessIcon, { color: theme.colors.textSubtle }]}>🔒</Text>
        <Text style={[styles.noAccessTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.noAccessMsg, { color: theme.colors.textSubtle }]}>{message}</Text>
      </View>
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
  statusChip: {
    borderWidth: 1,
    borderRadius: mobileRadius.pill,
    paddingHorizontal: mobileSpacing.sm + 2,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  skeletonLine: {
    height: 14,
    borderRadius: 999,
  },
  noAccessWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  noAccessCard: {
    borderWidth: 1,
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.lg,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: mobileSpacing.sm,
  },
  noAccessIcon: { fontSize: 34 },
  noAccessTitle: { fontSize: 24, fontWeight: '800' },
  noAccessMsg: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
