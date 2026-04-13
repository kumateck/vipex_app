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

function detailLine(label: string, value: string) {
  return `${label}: ${value}`;
}

function paymentMethodLabel(method: number | null | undefined) {
  if (method == null) return '-';
  if (method === 0) return 'Cash';
  if (method === 1) return 'Mobile Money';
  if (method === 2) return 'Card';
  if (method === 3) return 'Bank Transfer';
  return `Method ${method}`;
}

function prettyRoute(
  sourceBranch: string,
  sourceLocation: string,
  destinationBranch: string,
  destinationLocation: string,
) {
  return `${sourceBranch} (${sourceLocation}) -> ${destinationBranch} (${destinationLocation})`;
}

function branchLocationLabel(branchName?: string | null, locationName?: string | null) {
  const branch = branchName?.trim() || '-';
  const location = locationName?.trim() || '-';
  return `${branch} (${location})`;
}

export default function SuperSearchRecordDetailsScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<ParcelFullDetails | null>(null);
  const [row, setRow] = useState<ParcelSearchRow | null>(null);
  const [relatedRows, setRelatedRows] = useState<ParcelSearchRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  function buildDetailsFallback(inputRow: ParcelSearchRow | null): ParcelFullDetails | null {
    if (!inputRow) return null;
    const nowIso = new Date().toISOString();
    return {
      parcel: {
        id: inputRow.id,
        trackingCode: inputRow.trackingCode ?? '',
        bookingCode: inputRow.bookingCode ?? '',
        status: inputRow.status ?? 0,
        senderId: inputRow.sourceId ?? '',
        receiverId: inputRow.receiverId ?? '',
        sourceId: inputRow.sourceId ?? '',
        destinationId: inputRow.destinationId ?? '',
        parcelDetails: inputRow.parcelDetails ?? '',
        parcelContent: inputRow.parcelContent ?? '',
        parcelValuePsw: inputRow.parcelValuePsw ?? 0,
        chargePsw: inputRow.chargePsw ?? 0,
        plannedToBePaidPsw: inputRow.plannedToBePaidPsw ?? 0,
        createdAt: nowIso,
        receivedAt: null,
        confirmedAt: null,
      },
      pickupQueue: inputRow.pickupQueueId
        ? {
            id: inputRow.pickupQueueId,
            queueCode: inputRow.pickupQueueCode ?? '',
            queueNumber: inputRow.pickupQueueNumber ?? 0,
            queuedAt: inputRow.pickupQueuedAt ?? nowIso,
            paymentBucket: '',
          }
        : null,
      payments: [],
      delivery: null,
    };
  }

  async function load() {
    if (!parcelId) return;
    setLoading(true);
    setLoadError(null);
    try {
      if (!companyId) {
        try {
          const detailsPayload = await withAuth((token) => getParcelDetails(token, parcelId));
          setDetails(detailsPayload);
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to load parcel details without company context';
          setLoadError(message);
          setDetails(null);
        }
        setRow(null);
        setRelatedRows([]);
        return;
      }

      const parcelIdSearchPayload = await withAuth((token) =>
        searchParcels(token, {
          search: parcelId,
          companyId,
          includeDeleted: true,
          page: 1,
          pageSize: 50,
        }),
      );
      const parcelIdSearch = parcelIdSearchPayload.data ?? [];

      const baseRow =
        parcelIdSearch.find((item) => item.id === parcelId) ?? parcelIdSearch[0] ?? null;
      const bookingCodeFromSearch = baseRow?.bookingCode?.trim();
      const trackingCodeFromSearch = baseRow?.trackingCode?.trim();

      const detailLookupKeys = [parcelId, bookingCodeFromSearch, trackingCodeFromSearch].filter(
        (value): value is string => Boolean(value && value.trim()),
      );

      let detailsPayload: ParcelFullDetails | null = null;
      let lastDetailError: Error | null = null;
      for (const key of detailLookupKeys) {
        try {
          detailsPayload = await withAuth((token) => getParcelDetails(token, key));
          break;
        } catch (err) {
          lastDetailError = err instanceof Error ? err : new Error(String(err));
        }
      }

      if (!detailsPayload) {
        const fallbackDetails = buildDetailsFallback(baseRow);
        if (!fallbackDetails) {
          throw lastDetailError ?? new Error('Unable to load parcel details.');
        }
        setDetails(fallbackDetails);
      } else {
        setDetails(detailsPayload);
      }

      const resolvedBookingCode = (
        detailsPayload?.parcel.bookingCode ??
        baseRow?.bookingCode ??
        ''
      ).trim();
      const bookingSearch =
        resolvedBookingCode &&
        resolvedBookingCode !== parcelId &&
        resolvedBookingCode !== bookingCodeFromSearch
          ? await withAuth((token) =>
              searchParcels(token, {
                search: resolvedBookingCode,
                companyId,
                includeDeleted: true,
                page: 1,
                pageSize: 50,
              }),
            )
          : null;

      const mergedById = new Map<string, ParcelSearchRow>();
      for (const item of [...parcelIdSearch, ...(bookingSearch?.data ?? [])]) {
        if (!item?.id) continue;
        mergedById.set(item.id, item);
      }
      const mergedRows = [...mergedById.values()];
      setRelatedRows(mergedRows);
      setRow(mergedRows.find((item) => item.id === parcelId) ?? mergedRows[0] ?? null);

      // If we had to fallback before related rows were merged, refresh the fallback with strongest row.
      if (!detailsPayload) {
        const strongestRow =
          mergedRows.find((item) => item.id === parcelId) ?? mergedRows[0] ?? baseRow;
        setDetails(buildDetailsFallback(strongestRow));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load record details';
      setLoadError(message);
      notifyError('Load failed', message);
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
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          {loadError ? `Unable to load details: ${loadError}` : 'Record not found.'}
        </Text>
      </AppScreen>
    );
  }

  const sourceBranchName = row?.sourceName ?? '-';
  const sourceLocationName = row?.sourceLocationName ?? '-';
  const destinationBranchName = row?.destinationName ?? '-';
  const destinationLocationName = row?.destinationLocationName ?? row?.pickupLocationName ?? '-';

  const branchNameById = new Map<string, string>();
  for (const entry of relatedRows) {
    if (entry.sourceId && entry.sourceName) branchNameById.set(entry.sourceId, entry.sourceName);
    if (entry.destinationId && entry.destinationName) {
      branchNameById.set(entry.destinationId, entry.destinationName);
    }
  }

  return (
    <AppScreen refreshing={loading} onRefresh={() => void load()}>
      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Parcel</Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          {detailLine('Booking', details.parcel.bookingCode)}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          {detailLine('Tracking', details.parcel.trackingCode)}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          {detailLine('Source', branchLocationLabel(sourceBranchName, sourceLocationName))}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          {detailLine(
            'Destination',
            branchLocationLabel(destinationBranchName, destinationLocationName),
          )}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          {detailLine(
            'Route',
            prettyRoute(
              sourceBranchName,
              sourceLocationName,
              destinationBranchName,
              destinationLocationName,
            ),
          )}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          {detailLine('Sender', `${row?.senderName ?? '-'} (${row?.senderPhone ?? '-'})`)}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          {detailLine('Receiver', `${row?.receiverName ?? '-'} (${row?.receiverPhone ?? '-'})`)}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          {detailLine('Details', details.parcel.parcelDetails)}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          {detailLine('Content', details.parcel.parcelContent)}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          {detailLine(
            'Charge',
            `${formatCedis(details.parcel.chargePsw)} | To Be Paid: ${formatCedis(
              details.parcel.plannedToBePaidPsw,
            )}`,
          )}
        </Text>
        <Text style={[styles.line, { color: theme.colors.textMuted }]}>
          {detailLine('Created', formatDate(details.parcel.createdAt))}
        </Text>
        <AppStatusChip label={details.parcel.status} />
      </AppCard>

      {details.internalHolder ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Current Holder</Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Branch', details.internalHolder.branchName ?? '-')}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Location', details.internalHolder.locationName ?? '-')}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Warehouse', details.internalHolder.warehouseName ?? '-')}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Updated', formatDate(details.internalHolder.updatedAt))}
          </Text>
        </AppCard>
      ) : null}

      {details.pickupQueue ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Pickup Queue</Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Queue Code', details.pickupQueue.queueCode)}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Queue Number', String(details.pickupQueue.queueNumber))}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Queued At', formatDate(details.pickupQueue.queuedAt))}
          </Text>
        </AppCard>
      ) : null}

      {details.delivery ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Delivery</Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Status', details.delivery.status)}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Address', details.delivery.dropoffAddress ?? '-')}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Amount Paid', formatCedis(details.delivery.amountPaidPsw))}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Delivered At', formatDate(details.delivery.deliveredAt))}
          </Text>
        </AppCard>
      ) : null}

      {details.payments.length ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Payments</Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Count', String(details.payments.length))}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine(
              'Total Paid',
              formatCedis(
                details.payments.reduce((sum, payment) => sum + (payment.grossAmountPsw ?? 0), 0),
              ),
            )}
          </Text>
          {details.payments.map((payment) => (
            <View
              key={payment.id}
              style={[styles.recordItem, { borderTopColor: theme.colors.border }]}
            >
              <Text style={[styles.line, { color: theme.colors.text }]}>
                {detailLine('Amount', formatCedis(payment.grossAmountPsw))}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Method', paymentMethodLabel(payment.method))}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Received', formatDate(payment.receivedAt))}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Receipt', payment.receiptNo ?? '-')}
              </Text>
              {payment.notes ? (
                <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                  {detailLine('Notes', payment.notes)}
                </Text>
              ) : null}
              {payment.voidedAt ? (
                <Text style={[styles.line, { color: theme.colors.danger }]}>
                  {detailLine(
                    'Voided',
                    `${formatDate(payment.voidedAt)} (${payment.voidReason ?? 'No reason'})`,
                  )}
                </Text>
              ) : null}
            </View>
          ))}
        </AppCard>
      ) : null}

      {details.consignments?.length ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Consignments</Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Count', String(details.consignments.length))}
          </Text>
          {details.consignments.map((entry) => (
            <View
              key={`${entry.consignmentId}-${entry.addedAt}`}
              style={[styles.recordItem, { borderTopColor: theme.colors.border }]}
            >
              <Text style={[styles.line, { color: theme.colors.text }]}>
                {detailLine('Code', entry.code)}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Date', formatDate(entry.consignmentDate))}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine(
                  'Route',
                  `${branchNameById.get(entry.sourceId) ?? 'Unknown'} -> ${
                    branchNameById.get(entry.destinationId) ?? 'Unknown'
                  }`,
                )}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Added', formatDate(entry.addedAt))}
              </Text>
              {entry.removedAt ? (
                <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                  {detailLine('Removed', formatDate(entry.removedAt))}
                </Text>
              ) : null}
            </View>
          ))}
        </AppCard>
      ) : null}

      {details.dispositionActions?.length ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Disposition Actions
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Count', String(details.dispositionActions.length))}
          </Text>
          {details.dispositionActions.map((entry) => (
            <View
              key={entry.id}
              style={[styles.recordItem, { borderTopColor: theme.colors.border }]}
            >
              <Text style={[styles.line, { color: theme.colors.text }]}>
                {detailLine('Action Type', String(entry.actionType))}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Performed By', entry.performedByName ?? '-')}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Performed At', formatDate(entry.performedAt))}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Warehouse', entry.warehouseName ?? '-')}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Recovered', formatCedis(entry.recoveredAmountPsw))}
              </Text>
              {entry.notes ? (
                <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                  {detailLine('Notes', entry.notes)}
                </Text>
              ) : null}
            </View>
          ))}
        </AppCard>
      ) : null}

      {details.storageWaivers?.length ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Storage Waivers</Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Count', String(details.storageWaivers.length))}
          </Text>
          {details.storageWaivers.map((entry) => (
            <View
              key={entry.id}
              style={[styles.recordItem, { borderTopColor: theme.colors.border }]}
            >
              <Text style={[styles.line, { color: theme.colors.text }]}>
                {detailLine('Waived Amount', formatCedis(entry.waivedAmountPsw))}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Reason', entry.reason)}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Waived By', entry.waivedByName ?? '-')}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Waived At', formatDate(entry.waivedAt))}
              </Text>
            </View>
          ))}
        </AppCard>
      ) : null}

      {details.storageSettlement ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Storage Settlement
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Accrued', formatCedis(details.storageSettlement.accruedPsw))}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Paid', formatCedis(details.storageSettlement.paidPsw))}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Waived', formatCedis(details.storageSettlement.waivedPsw))}
          </Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Outstanding', formatCedis(details.storageSettlement.outstandingPsw))}
          </Text>
        </AppCard>
      ) : null}

      {relatedRows.length ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Related Records</Text>
          <Text style={[styles.line, { color: theme.colors.textMuted }]}>
            {detailLine('Found', `booking / tracking references: ${relatedRows.length}`)}
          </Text>
          {relatedRows.map((entry) => (
            <View
              key={entry.id}
              style={[styles.recordItem, { borderTopColor: theme.colors.border }]}
            >
              <Text style={[styles.line, { color: theme.colors.text }]}>
                {detailLine('Booking', entry.bookingCode)}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Tracking', entry.trackingCode)}
              </Text>
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>
                {detailLine('Status', String(entry.status))}
              </Text>
            </View>
          ))}
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  line: {},
  recordItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 2,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  empty: { textAlign: 'center', marginTop: mobileSpacing.sm },
});
