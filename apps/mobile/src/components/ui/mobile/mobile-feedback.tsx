import { StyleSheet, Text, View } from 'react-native';
import { getParcelStatusLabel } from '@mobile/constants/parcel-status';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing } from '@mobile/theme/layout';

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
