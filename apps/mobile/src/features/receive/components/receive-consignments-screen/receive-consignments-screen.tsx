import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from '@mobile/navigation/router-compat';
import { AppScreen } from '@mobile/components/screen';
import { listIncomingConsignments, type IncomingConsignment } from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canViewIncomingConsignments } from '@mobile/lib/permissions';
import { hapticTap } from '@mobile/lib/haptics';
import { AppCard, AppSkeletonCard, MobileNoAccess } from '@/components/ui/mobile';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

const CONSIGNMENT_STATUS = {
  OPEN: 0,
  CLOSED: 1,
  CLOSED_WITH_EXCEPTIONS: 2,
} as const;

function StatusChip({ item }: { item: IncomingConsignment }) {
  const { theme } = useAppearance();
  const tone =
    item.status === CONSIGNMENT_STATUS.CLOSED_WITH_EXCEPTIONS
      ? theme.colors.danger
      : item.status === CONSIGNMENT_STATUS.CLOSED
        ? theme.colors.success
        : theme.colors.warning;
  const label =
    item.status === CONSIGNMENT_STATUS.CLOSED_WITH_EXCEPTIONS
      ? 'Closed with exceptions'
      : item.status === CONSIGNMENT_STATUS.CLOSED
        ? 'Closed'
        : 'Open';
  return (
    <View style={[styles.chip, { backgroundColor: `${tone}22`, borderColor: tone }]}>
      <Text style={[styles.chipText, { color: tone }]}>{label}</Text>
    </View>
  );
}

export function ReceiveConsignmentsScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canView = canViewIncomingConsignments(permissions);
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const branchId = session.user?.branch?.id ?? session.user?.branchId;

  const [rows, setRows] = useState<IncomingConsignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId || !branchId) return;
    setLoading(true);
    try {
      const data = await withAuth((token) =>
        listIncomingConsignments(token, { companyId, destinationId: branchId }),
      );
      setRows(data);
    } catch (err) {
      notifyError(
        'Load failed',
        err instanceof Error ? err.message : 'Unable to load incoming consignments',
      );
    } finally {
      setLoading(false);
    }
  }, [branchId, companyId, withAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access consignment receiving." />
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={loading} onRefresh={() => void load()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Incoming Consignments</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Consignments dispatched to your branch. Open one to scan parcels against its checklist.
      </Text>

      {loading ? (
        <View style={styles.list}>
          <AppSkeletonCard lines={3} />
          <AppSkeletonCard lines={3} />
        </View>
      ) : rows.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          No incoming consignments yet.
        </Text>
      ) : (
        <View style={styles.list}>
          {rows.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                router.push(`/(app)/receive-consignment/${item.id}`);
                void hapticTap();
              }}
            >
              <AppCard>
                <View style={styles.rowHead}>
                  <Text style={[styles.code, { color: theme.colors.text }]}>{item.code}</Text>
                  <StatusChip item={item} />
                </View>
                <Text style={[styles.meta, { color: theme.colors.textSubtle }]}>
                  From {item.sourceName}
                </Text>
                <Text style={[styles.progress, { color: theme.colors.secondary }]}>
                  {item.arrived} of {item.total} arrived
                </Text>
              </AppCard>
            </Pressable>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title1 },
  subtitle: { ...mobileTextStyles.subhead, marginTop: -2, marginBottom: mobileSpacing.xs },
  list: { gap: mobileSpacing.sm + 2 },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  code: { ...mobileTextStyles.headline },
  meta: { ...mobileTextStyles.caption1, marginTop: 2 },
  progress: { ...mobileTextStyles.subhead, fontWeight: '700', marginTop: mobileSpacing.xs },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.sm,
    paddingHorizontal: mobileSpacing.sm,
    paddingVertical: 4,
  },
  chipText: { ...mobileTextStyles.caption2, fontWeight: '700' },
  empty: { ...mobileTextStyles.subhead, textAlign: 'center', marginTop: mobileSpacing.lg + 2 },
});
