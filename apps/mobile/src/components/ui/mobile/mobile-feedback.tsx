import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getParcelStatusLabel } from '@mobile/constants/parcel-status';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

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

  const tone = isGood
    ? theme.colors.success
    : isWarn
      ? theme.colors.warning
      : isError
        ? theme.colors.danger
        : theme.colors.textMuted;
  const icon = isGood
    ? ('checkmark-circle' as const)
    : isWarn
      ? ('time' as const)
      : isError
        ? ('close-circle' as const)
        : ('ellipse' as const);
  const bg = isGood || isWarn || isError ? `${tone}1F` : theme.colors.cardMuted;

  return (
    <View style={[styles.statusChip, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={13} color={tone} />
      <Text style={[styles.statusChipText, { color: tone }]}>{normalizedLabel}</Text>
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
          mobileShadow.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
            borderWidth: theme.scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
          },
        ]}
      >
        <View style={[styles.noAccessIconWrap, { backgroundColor: theme.colors.cardMuted }]}>
          <Ionicons name="lock-closed-outline" size={26} color={theme.colors.textSubtle} />
        </View>
        <Text style={[styles.noAccessTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.noAccessMsg, { color: theme.colors.textSubtle }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: mobileRadius.pill,
    paddingHorizontal: mobileSpacing.sm + 2,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusChipText: {
    ...mobileTextStyles.footnote,
    fontWeight: '700',
  },
  noAccessWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mobileSpacing.xl,
  },
  noAccessCard: {
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.xl,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: mobileSpacing.sm,
  },
  noAccessIconWrap: {
    width: 52,
    height: 52,
    borderRadius: mobileRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: mobileSpacing.xs,
  },
  noAccessTitle: { ...mobileTextStyles.title2 },
  noAccessMsg: { ...mobileTextStyles.body, textAlign: 'center' },
});
