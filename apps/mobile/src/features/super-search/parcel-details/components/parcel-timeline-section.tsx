import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { ParcelHistoryEvent } from '@mobile/types/parcels';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { formatDate, groupHistoryByDay } from '../utils';

/** Who did what and when, newest first, grouped by day. */
export function ParcelTimelineSection({
  events,
  loading,
  error,
}: {
  events: ParcelHistoryEvent[];
  loading: boolean;
  error: string | null;
}) {
  const { theme } = useAppearance();
  const muted = { color: theme.colors.textSubtle };

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>History ({events.length})</Text>
      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={[styles.note, muted]}>{error} Pull down to retry.</Text> : null}
      {!loading && !error && events.length === 0 ? (
        <Text style={[styles.note, muted]}>No recorded history.</Text>
      ) : null}
      {groupHistoryByDay(events).map(({ day, items }) => (
        <View key={day} style={styles.day}>
          <Text style={[styles.dayLabel, muted]}>{day.toUpperCase()}</Text>
          {items.map((event) => (
            <View key={event.id} style={[styles.entry, { borderLeftColor: theme.colors.primary }]}>
              <Text style={[styles.entryTitle, { color: theme.colors.text }]}>{event.title}</Text>
              {event.description ? (
                <Text style={[styles.note, { color: theme.colors.textMuted }]}>
                  {event.description}
                </Text>
              ) : null}
              <Text style={[styles.meta, muted]}>
                {formatDate(event.occurredAt)}
                {event.actorName ? ` · by ${event.actorName}` : ''}
                {event.branchName ? ` · ${event.branchName}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title3 },
  day: { gap: mobileSpacing.sm, marginTop: mobileSpacing.sm },
  dayLabel: { ...mobileTextStyles.caption2, fontWeight: '700', letterSpacing: 0.5 },
  entry: { borderLeftWidth: 2, paddingLeft: mobileSpacing.md, gap: 2 },
  entryTitle: { ...mobileTextStyles.subhead, fontWeight: '600' },
  note: { ...mobileTextStyles.footnote },
  meta: { ...mobileTextStyles.caption1 },
});
