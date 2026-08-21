import { StyleSheet, Text, View } from 'react-native';
import type { ConsignmentItem } from '@mobile/lib/api';
import { AppCard } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type ConsignmentChecklistCardProps = { items: ConsignmentItem[]; loading: boolean };

export function ConsignmentChecklistCard({ items, loading }: ConsignmentChecklistCardProps) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Checklist</Text>
      {loading ? (
        <Text style={[styles.helper, { color: theme.colors.textSubtle }]}>Loading...</Text>
      ) : null}
      {!loading && items.length === 0 ? (
        <Text style={[styles.helper, { color: theme.colors.textSubtle }]}>
          No parcels in this consignment.
        </Text>
      ) : null}
      {!loading && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item) => (
            <View
              key={item.parcelId}
              style={[styles.row, { borderTopColor: theme.colors.separator }]}
            >
              <View style={styles.itemText}>
                <Text style={[styles.code, { color: theme.colors.text }]}>{item.bookingCode}</Text>
                <Text style={[styles.meta, { color: theme.colors.textSubtle }]}>
                  {item.receiverName}
                </Text>
              </View>
              <Text
                style={[
                  styles.status,
                  { color: item.arrivedAt ? theme.colors.success : theme.colors.textMuted },
                ]}
              >
                {item.arrivedAt ? 'Arrived' : 'Pending'}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.headline },
  helper: { ...mobileTextStyles.subhead },
  list: { marginTop: -mobileSpacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  itemText: { flex: 1 },
  code: { ...mobileTextStyles.subhead, fontWeight: '700' },
  meta: { ...mobileTextStyles.caption1 },
  status: { ...mobileTextStyles.caption1, fontWeight: '700' },
});
