import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppearance } from '@/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTypography } from '@/theme/layout';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

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

export function AppStatusChip({ label }: { label: string | number }) {
  const normalizedLabel = String(label);
  const { theme } = useAppearance();
  const normalized = normalizedLabel.toLowerCase();
  const isGood =
    normalized.includes('arrived') ||
    normalized.includes('delivered') ||
    normalized.includes('paid');
  const isWarn =
    normalized.includes('pending') ||
    normalized.includes('transit') ||
    normalized.includes('awaiting');
  const icon = isGood ? '✓' : isWarn ? '⏳' : '•';
  const fg = isGood ? theme.colors.success : isWarn ? '#b37a00' : theme.colors.textMuted;
  const bg = isGood
    ? theme.scheme === 'dark'
      ? '#0f2a1a'
      : '#ecfdf3'
    : isWarn
      ? theme.scheme === 'dark'
        ? '#2b1f08'
        : '#fff7e6'
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
