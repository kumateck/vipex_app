import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CashierSession, CashierSessionSummary } from '../../types';
import { formatMoneyPsw, formatTime, isActiveSession } from '../../utils';

type ActiveSessionCardProps = {
  session: CashierSession | null;
  summary: CashierSessionSummary | null;
  action?: { title: string; onPress: () => void };
};

function SessionMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color }]}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, { color }]}>
        {value}
      </Text>
    </View>
  );
}

export function ActiveSessionCard({ session, summary, action }: ActiveSessionCardProps) {
  const { theme } = useAppearance();
  const foreground = theme.colors.primaryText;

  if (!session || !isActiveSession(session.status)) {
    return (
      <View style={[styles.emptyCard, mobileShadow.card, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.primary}18` }]}>
          <Ionicons name="time-outline" size={23} color={theme.colors.primary} />
        </View>
        <View style={styles.emptyCopy}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No active session</Text>
          <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>
            Your live totals will appear here when a cashier session is opened.
          </Text>
        </View>
        {action ? (
          <View style={styles.emptyAction}>
            <AppButton title={action.title} onPress={action.onPress} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.card, mobileShadow.floating, { backgroundColor: theme.colors.primary }]}>
      <View
        pointerEvents="none"
        style={[styles.orbLarge, { backgroundColor: `${foreground}10` }]}
      />
      <View
        pointerEvents="none"
        style={[styles.orbSmall, { backgroundColor: `${foreground}13` }]}
      />
      <View style={styles.cardTop}>
        <View>
          <Text style={[styles.eyebrow, { color: `${foreground}B8` }]}>ACTIVE SESSION</Text>
          <Text style={[styles.started, { color: foreground }]}>
            Started {formatTime(session.scheduledStartTime)}
          </Text>
        </View>
        <View style={[styles.status, { backgroundColor: `${foreground}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: foreground }]} />
          <Text style={[styles.statusText, { color: foreground }]}>Live</Text>
        </View>
      </View>

      <View style={styles.salesBlock}>
        <Text style={[styles.salesLabel, { color: `${foreground}B8` }]}>Session sales</Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.salesValue, { color: foreground }]}
        >
          {formatMoneyPsw(summary?.totalSalesPsw ?? session.totalReceivedPsw)}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: `${foreground}26` }]} />
      <View style={styles.metricGrid}>
        <SessionMetric
          label="Amount paid"
          value={formatMoneyPsw(summary?.amountPaidPsw)}
          color={foreground}
        />
        <SessionMetric
          label="To be paid"
          value={formatMoneyPsw(summary?.toBePaidPsw)}
          color={foreground}
        />
        <SessionMetric
          label="Total credit"
          value={formatMoneyPsw(summary?.totalCreditCreatedPsw)}
          color={foreground}
        />
        <SessionMetric
          label="Receiver payments"
          value={formatMoneyPsw(summary?.totalToBePaidCollectedPsw)}
          color={foreground}
        />
      </View>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.activeAction,
            { backgroundColor: `${foreground}${pressed ? '2E' : '1F'}` },
          ]}
        >
          <Ionicons name="stop-circle-outline" size={19} color={foreground} />
          <Text style={[styles.activeActionText, { color: foreground }]}>{action.title}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: mobileRadius.xl,
    padding: mobileSpacing.xl,
    gap: mobileSpacing.md,
  },
  orbLarge: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -65,
    top: -70,
  },
  orbSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    left: -35,
    bottom: -35,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
  },
  eyebrow: { ...mobileTextStyles.eyebrow },
  started: { ...mobileTextStyles.subhead, marginTop: 2, fontWeight: '600' },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: mobileRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { ...mobileTextStyles.caption1, fontWeight: '700' },
  salesBlock: { gap: 1 },
  salesLabel: { ...mobileTextStyles.subhead },
  salesValue: { fontSize: 32, lineHeight: 39, fontWeight: '800', letterSpacing: -0.7 },
  divider: { height: StyleSheet.hairlineWidth },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: mobileSpacing.md },
  metric: { flexBasis: '50%', minWidth: 0, paddingRight: mobileSpacing.sm, gap: 1 },
  metricLabel: { ...mobileTextStyles.caption1, opacity: 0.72 },
  metricValue: { ...mobileTextStyles.subhead, fontWeight: '700' },
  activeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: mobileRadius.md,
    minHeight: 46,
    paddingHorizontal: mobileSpacing.md,
  },
  activeActionText: { ...mobileTextStyles.body, fontWeight: '700' },
  emptyCard: { borderRadius: mobileRadius.xl, padding: mobileSpacing.lg, gap: mobileSpacing.md },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: { flex: 1, minWidth: 0, gap: 2 },
  emptyAction: { width: '100%' },
  emptyTitle: { ...mobileTextStyles.headline },
  emptyBody: { ...mobileTextStyles.footnote },
});
