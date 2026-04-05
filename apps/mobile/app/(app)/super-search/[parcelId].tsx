import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@mobile/components/screen';
import { getParcelDetails, searchParcels } from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { hapticError } from '@mobile/lib/haptics';
import { AppCard, AppStatusChip } from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

function formatCedis(psw: number | null | undefined) {
  return `GH₵ ${((psw ?? 0) / 100).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export default function SuperSearchRecordDetailsScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<ParcelFullDetails | null>(null);
  const [row, setRow] = useState<ParcelSearchRow | null>(null);

  async function load() {
    if (!parcelId || !companyId) return;
    setLoading(true);
    try {
      const detailsPayload = await withAuth((token) => getParcelDetails(token, parcelId));
      setDetails(detailsPayload);

      const searchPayload = await withAuth((token) =>
        searchParcels(token, {
          search: detailsPayload.parcel.bookingCode,
          companyId,
          includeDeleted: true,
          page: 1,
          pageSize: 30,
        }),
      );
      setRow(searchPayload.data.find((item) => item.id === parcelId) ?? null);
    } catch (err) {
      notifyError(
        'Load failed',
        err instanceof Error ? err.message : 'Unable to load record details',
      );
      void hapticError();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [parcelId, companyId]);

  if (loading) {
    return (
      <AppScreen>
        <AppCard>
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={{ color: theme.colors.textSubtle }}>Loading record details...</Text>
          </View>
        </AppCard>
      </AppScreen>
    );
  }

  if (!details) {
    return (
      <AppScreen>
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>Record not found.</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={loading} onRefresh={() => void load()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Record Details</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Full shipment and delivery timeline for this parcel.
      </Text>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Parcel</Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          Booking: {details.parcel.bookingCode}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          Sender: {row?.senderName ?? '-'} ({row?.senderPhone ?? '-'})
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          Receiver: {row?.receiverName ?? '-'} ({row?.receiverPhone ?? '-'})
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          Details: {details.parcel.parcelDetails}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          Content: {details.parcel.parcelContent}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          Charge: {formatCedis(details.parcel.chargePsw)} | To Be Paid:{' '}
          {formatCedis(details.parcel.plannedToBePaidPsw)}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          Created: {formatDate(details.parcel.createdAt)}
        </Text>
        <AppStatusChip label={details.parcel.status} />
      </AppCard>

      {details.delivery ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Delivery</Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            Status: {details.delivery.status}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            Address: {details.delivery.dropoffAddress ?? '-'}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            Amount Paid: {formatCedis(details.delivery.amountPaidPsw)}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            Delivered At: {formatDate(details.delivery.deliveredAt)}
          </Text>
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Payments</Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          Count: {details.payments.length}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          Total Paid:{' '}
          {formatCedis(
            details.payments.reduce((sum, payment) => sum + (payment.grossAmountPsw ?? 0), 0),
          )}
        </Text>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  line: {},
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  empty: { textAlign: 'center', marginTop: mobileSpacing.sm },
});
