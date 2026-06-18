import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';
import { detailLine, formatCedis, formatDate } from '../utils';

const sectionStyles = StyleSheet.create({
  recordItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 2,
  },
  title: { fontSize: 18, fontWeight: '700' },
});

export function ParcelHistorySections({
  details,
  relatedRows,
  branchNameById,
}: {
  details: ParcelFullDetails;
  relatedRows: ParcelSearchRow[];
  branchNameById: Map<string, string>;
}) {
  const { theme } = useAppearance();

  return (
    <>
      {details.consignments?.length ? (
        <AppCard>
          <Text style={[sectionStyles.title, { color: theme.colors.text }]}>Consignments</Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Count', String(details.consignments.length))}
          </Text>
          {details.consignments.map((entry) => (
            <View
              key={`${entry.consignmentId}-${entry.addedAt}`}
              style={[sectionStyles.recordItem, { borderTopColor: theme.colors.border }]}
            >
              <Text style={{ color: theme.colors.text }}>{detailLine('Code', entry.code)}</Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Date', formatDate(entry.consignmentDate))}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine(
                  'Route',
                  `${branchNameById.get(entry.sourceId) ?? 'Unknown'} -> ${
                    branchNameById.get(entry.destinationId) ?? 'Unknown'
                  }`,
                )}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Added', formatDate(entry.addedAt))}
              </Text>
              {entry.removedAt ? (
                <Text style={{ color: theme.colors.textMuted }}>
                  {detailLine('Removed', formatDate(entry.removedAt))}
                </Text>
              ) : null}
            </View>
          ))}
        </AppCard>
      ) : null}

      {details.dispositionActions?.length ? (
        <AppCard>
          <Text style={[sectionStyles.title, { color: theme.colors.text }]}>
            Disposition Actions
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Count', String(details.dispositionActions.length))}
          </Text>
          {details.dispositionActions.map((entry) => (
            <View
              key={entry.id}
              style={[sectionStyles.recordItem, { borderTopColor: theme.colors.border }]}
            >
              <Text style={{ color: theme.colors.text }}>
                {detailLine('Action Type', String(entry.actionType))}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Performed By', entry.performedByName ?? '-')}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Performed At', formatDate(entry.performedAt))}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Warehouse', entry.warehouseName ?? '-')}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Recovered', formatCedis(entry.recoveredAmountPsw))}
              </Text>
              {entry.notes ? (
                <Text style={{ color: theme.colors.textMuted }}>
                  {detailLine('Notes', entry.notes)}
                </Text>
              ) : null}
            </View>
          ))}
        </AppCard>
      ) : null}

      {relatedRows.length ? (
        <AppCard>
          <Text style={[sectionStyles.title, { color: theme.colors.text }]}>Related Records</Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Found', `booking / tracking references: ${relatedRows.length}`)}
          </Text>
          {relatedRows.map((entry) => (
            <View
              key={entry.id}
              style={[sectionStyles.recordItem, { borderTopColor: theme.colors.border }]}
            >
              <Text style={{ color: theme.colors.text }}>
                {detailLine('Booking', entry.bookingCode)}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Tracking', entry.trackingCode)}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Status', String(entry.status))}
              </Text>
            </View>
          ))}
        </AppCard>
      ) : null}
    </>
  );
}
