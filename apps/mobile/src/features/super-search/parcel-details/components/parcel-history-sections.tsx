import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { formatCedis, formatDate } from '../utils';

function DetailRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  const { theme } = useAppearance();
  return (
    <View
      style={[
        styles.detailRow,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.separator,
        },
      ]}
    >
      <Text style={[styles.detailLabel, { color: theme.colors.textSubtle }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

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
          <Text style={[styles.title, { color: theme.colors.text }]}>Consignments</Text>
          <View style={styles.detailList}>
            <DetailRow first label="Count" value={String(details.consignments.length)} />
          </View>
          {details.consignments.map((entry) => (
            <View
              key={`${entry.consignmentId}-${entry.addedAt}`}
              style={[styles.recordItem, { backgroundColor: theme.colors.cardMuted }]}
            >
              <View style={styles.detailList}>
                <DetailRow first label="Code" value={entry.code} />
                <DetailRow label="Date" value={formatDate(entry.consignmentDate)} />
                <DetailRow
                  label="Route"
                  value={`${branchNameById.get(entry.sourceId) ?? 'Unknown'} -> ${
                    branchNameById.get(entry.destinationId) ?? 'Unknown'
                  }`}
                />
                <DetailRow label="Added" value={formatDate(entry.addedAt)} />
                {entry.removedAt ? (
                  <DetailRow label="Removed" value={formatDate(entry.removedAt)} />
                ) : null}
              </View>
            </View>
          ))}
        </AppCard>
      ) : null}

      {details.dispositionActions?.length ? (
        <AppCard>
          <Text style={[styles.title, { color: theme.colors.text }]}>Disposition Actions</Text>
          <View style={styles.detailList}>
            <DetailRow first label="Count" value={String(details.dispositionActions.length)} />
          </View>
          {details.dispositionActions.map((entry) => (
            <View
              key={entry.id}
              style={[styles.recordItem, { backgroundColor: theme.colors.cardMuted }]}
            >
              <View style={styles.detailList}>
                <DetailRow first label="Action Type" value={String(entry.actionType)} />
                <DetailRow label="Performed By" value={entry.performedByName ?? '-'} />
                <DetailRow label="Performed At" value={formatDate(entry.performedAt)} />
                <DetailRow label="Warehouse" value={entry.warehouseName ?? '-'} />
                <DetailRow label="Recovered" value={formatCedis(entry.recoveredAmountPsw)} />
                {entry.notes ? <DetailRow label="Notes" value={entry.notes} /> : null}
              </View>
            </View>
          ))}
        </AppCard>
      ) : null}

      {relatedRows.length ? (
        <AppCard>
          <Text style={[styles.title, { color: theme.colors.text }]}>Related Records</Text>
          <View style={styles.detailList}>
            <DetailRow
              first
              label="Found"
              value={`booking / tracking references: ${relatedRows.length}`}
            />
          </View>
          {relatedRows.map((entry) => (
            <View
              key={entry.id}
              style={[styles.recordItem, { backgroundColor: theme.colors.cardMuted }]}
            >
              <View style={styles.detailList}>
                <DetailRow first label="Booking" value={entry.bookingCode} />
                <DetailRow label="Status" value={String(entry.status)} />
              </View>
            </View>
          ))}
        </AppCard>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title3 },
  detailList: { marginTop: -mobileSpacing.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
  },
  detailLabel: { ...mobileTextStyles.subhead, flexShrink: 0 },
  detailValue: { ...mobileTextStyles.subhead, fontWeight: '600', flex: 1, textAlign: 'right' },
  recordItem: {
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpacing.md,
    marginTop: mobileSpacing.xs,
  },
});
