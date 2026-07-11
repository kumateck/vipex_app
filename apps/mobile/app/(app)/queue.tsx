import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AppScreen } from '@mobile/components/screen';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import {
  createPickupQueue,
  getParcelDetails,
  listPickupQueueCards,
  searchParcels,
} from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { ParcelFullDetails, ParcelSearchRow, PickupQueueCard } from '@mobile/types/parcels';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import {
  canCreateQueueTicket,
  canSearchParcelsForQueue,
  canViewQueueScreen,
  canViewReceiverQueueBoard,
  canViewSenderQueueBoard,
} from '@mobile/lib/permissions';
import { hapticError, hapticSuccess, hapticTap, hapticWarning } from '@mobile/lib/haptics';
import { ParcelCard, QueueCard, StatCard } from '@mobile/components/courier';
import {
  AppButton,
  AppCard,
  AppInput,
  AppSkeletonCard,
  AppStatusChip,
  MobileNoAccess,
} from '@/components/ui/mobile';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

function formatCedis(psw: number | null | undefined) {
  return `GH₵ ${((psw ?? 0) / 100).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

function toLocalDateKey(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildQueueShareMessages(input: {
  queueCode: string;
  bookingCode?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  branchName?: string;
  branchContact?: string;
  branchLocation?: string;
  companyName?: string;
}) {
  const receiverName = input.receiverName ?? '-';
  const receiverPhone = input.receiverPhone ?? '-';
  const bookingCode = input.bookingCode ?? '-';
  const branchName = input.branchName ?? '-';
  const branchContact = input.branchContact?.trim();
  const branchLocation = input.branchLocation?.trim();
  const companyName = input.companyName ?? 'Vipex';
  const queueCode = input.queueCode;

  const shortLines = [
    `${companyName} Queue Ticket`,
    `Code: ${queueCode}`,
    `Booking: ${bookingCode}`,
    `Receiver: ${receiverName}`,
    `Branch: ${branchName}`,
  ];
  if (branchContact) shortLines.push(`Branch Contact: ${branchContact}`);
  if (branchLocation) shortLines.push(`Branch Location: ${branchLocation}`);

  const fullLines = [
    `Queue Ticket: ${queueCode}`,
    `Booking Code: ${bookingCode}`,
    `Receiver: ${receiverName} (${receiverPhone})`,
    `Branch: ${branchName}`,
  ];
  if (branchContact) fullLines.push(`Branch Contact: ${branchContact}`);
  if (branchLocation) fullLines.push(`Branch Location: ${branchLocation}`);
  fullLines.push('Please present this queue code at pickup.');

  return { short: shortLines.join('\n'), full: fullLines.join('\n') };
}

function DetailRow({ label, value, first }: { label: string; value: ReactNode; first?: boolean }) {
  const { theme } = useAppearance();
  const isPrimitive = typeof value === 'string' || typeof value === 'number';

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
      {isPrimitive ? (
        <Text style={[styles.detailValue, { color: theme.colors.text }]} numberOfLines={2}>
          {value}
        </Text>
      ) : (
        <View style={styles.detailValueWrap}>{value}</View>
      )}
    </View>
  );
}

export default function QueueScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canView = canViewQueueScreen(permissions);
  const canIssueTicket = canCreateQueueTicket(permissions);
  const canReadParcels = canSearchParcelsForQueue(permissions);
  const canReadReceiverBoard = canViewReceiverQueueBoard(permissions);
  const canReadSenderBoard = canViewSenderQueueBoard(permissions);
  const branchId = session.user?.branch?.id ?? session.user?.branchId;
  const branchName = session.user?.branch?.name ?? '-';
  const branchContact =
    session.user?.branch?.telephone?.trim() || session.user?.branch?.phone?.trim() || '';
  const branchLocation =
    session.user?.location?.name?.trim() ||
    session.user?.branch?.location?.trim() ||
    session.user?.branch?.address?.trim() ||
    '';
  const companyName = session.user?.company?.name ?? 'Vipex';
  const companyId = session.user?.company?.id ?? session.user?.companyId;

  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ParcelSearchRow[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<ParcelFullDetails | null>(null);
  const [receiverQueueCards, setReceiverQueueCards] = useState<PickupQueueCard[]>([]);
  const [waitingPickupQueueCards, setWaitingPickupQueueCards] = useState<PickupQueueCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [queueingParcelId, setQueueingParcelId] = useState<string | null>(null);

  const canIssueQueue = useMemo(() => {
    if (!selectedParcel) return false;
    const queuedAt =
      selectedDetails?.pickupQueue?.queuedAt ?? selectedParcel.pickupQueuedAt ?? null;
    const queueDateKey = toLocalDateKey(queuedAt);
    const todayDateKey = toLocalDateKey(new Date().toISOString());
    const hasQueueForToday = Boolean(queueDateKey && todayDateKey && queueDateKey === todayDateKey);
    return selectedParcel.status === ParcelStatus.AWAITING_PICKUP && !hasQueueForToday;
  }, [selectedDetails?.pickupQueue?.queuedAt, selectedParcel]);

  useEffect(() => {
    if (!branchId) return;
    void loadQueueBoards();
  }, [branchId]);

  async function loadQueueBoards() {
    if (!branchId) return;
    setLoadingBoards(true);
    try {
      const [receiver, waiting] = await withAuth(async (token) => {
        return Promise.all([
          listPickupQueueCards(token, { branchId, paymentBucket: 'TP' }),
          listPickupQueueCards(token, { branchId, paymentBucket: 'SP' }),
        ]);
      });
      setReceiverQueueCards(receiver);
      setWaitingPickupQueueCards(waiting);
    } catch (err) {
      notifyError(
        'Queue board failed',
        err instanceof Error ? err.message : 'Unable to load queue boards',
      );
      void hapticError();
    } finally {
      setLoadingBoards(false);
    }
  }

  async function handleSearch() {
    if (!companyId) {
      Alert.alert('Missing context', 'User company or branch is missing.');
      void hapticWarning();
      return;
    }

    setLoading(true);
    try {
      const data = await withAuth((token) =>
        searchParcels(token, {
          search: search.trim(),
          companyId,
          destinationId: branchId ?? undefined,
          status: ParcelStatus.AWAITING_PICKUP,
          page: 1,
          pageSize: 20,
        }),
      );
      setRows(data.data ?? []);
      void hapticTap();
    } catch (err) {
      notifyError('Search failed', err instanceof Error ? err.message : 'Unable to search parcels');
      void hapticError();
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectParcel(parcel: ParcelSearchRow) {
    setSelectedParcel(parcel);
    try {
      const details = await withAuth((token) => getParcelDetails(token, parcel.id));
      setSelectedDetails(details);
    } catch (err) {
      setSelectedDetails(null);
      notifyError(
        'Parcel details failed',
        err instanceof Error ? err.message : 'Unable to load parcel details',
      );
      void hapticError();
    }
  }

  async function handleQueue(parcelId: string) {
    try {
      setQueueingParcelId(parcelId);
      const response = await withAuth((token) => createPickupQueue(token, { parcelId }));
      const queueCode = response.queueCode?.trim() ?? '';
      const parcelContext =
        (selectedParcel?.id === parcelId ? selectedParcel : null) ??
        rows.find((row) => row.id === parcelId) ??
        null;

      if (queueCode) {
        const messages = buildQueueShareMessages({
          queueCode,
          bookingCode: parcelContext?.bookingCode,
          receiverName: parcelContext?.receiverName,
          receiverPhone: parcelContext?.receiverPhone,
          branchName,
          branchContact,
          branchLocation,
          companyName,
        });

        const handleCopyCode = async () => {
          try {
            await Clipboard.setStringAsync(queueCode);
            notifySuccess('Queue code copied.');
          } catch (err) {
            notifyError(
              'Copy failed',
              err instanceof Error ? err.message : 'Unable to copy queue code',
            );
          }
        };

        const handleShareShort = async () => {
          try {
            await Share.share({ message: messages.short });
          } catch (err) {
            notifyError(
              'Share failed',
              err instanceof Error ? err.message : 'Unable to share queue ticket',
            );
          }
        };

        const handleShareFull = async () => {
          try {
            await Share.share({ message: messages.full });
          } catch (err) {
            notifyError(
              'Share failed',
              err instanceof Error ? err.message : 'Unable to share queue ticket',
            );
          }
        };

        Alert.alert('Queue created', `Queue: ${queueCode}`, [
          { text: 'Copy Code', onPress: () => void handleCopyCode() },
          { text: 'Share (Short)', onPress: () => void handleShareShort() },
          { text: 'Share (Full)', onPress: () => void handleShareFull() },
          { text: 'Done', style: 'cancel' },
        ]);
        void hapticSuccess();
      } else {
        notifySuccess('Ticket created');
        void hapticSuccess();
      }

      await handleSearch();
      await loadQueueBoards();
      if (selectedParcel?.id === parcelId) {
        const details = await withAuth((token) => getParcelDetails(token, parcelId));
        setSelectedDetails(details);
      }
    } catch (err) {
      notifyError('Queue failed', err instanceof Error ? err.message : 'Unable to queue parcel');
      void hapticError();
    } finally {
      setQueueingParcelId(null);
    }
  }

  async function copyQueueCode(queueCode: string) {
    try {
      await Clipboard.setStringAsync(queueCode);
      notifySuccess('Queue code copied.');
    } catch (err) {
      notifyError('Copy failed', err instanceof Error ? err.message : 'Unable to copy queue code');
      void hapticError();
    }
  }

  async function shareQueueCard(card: PickupQueueCard, mode: 'short' | 'full') {
    const messages = buildQueueShareMessages({
      queueCode: card.queueCode,
      bookingCode: card.bookingCode,
      receiverName: card.receiverName,
      receiverPhone: card.receiverPhone,
      branchName,
      branchContact,
      branchLocation,
      companyName,
    });

    try {
      await Share.share({ message: mode === 'short' ? messages.short : messages.full });
    } catch (err) {
      notifyError(
        'Share failed',
        err instanceof Error ? err.message : 'Unable to share queue ticket',
      );
      void hapticError();
    }
  }

  const showSearchResults = search.trim().length > 0;
  const recentPayments = (selectedDetails?.payments ?? []).slice(0, 3);

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access queue operations." />
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={loadingBoards} onRefresh={() => void loadQueueBoards()}>
      <View style={styles.kpiRow}>
        <StatCard label="Receiver Queue" value={receiverQueueCards.length} />
        <StatCard label="Waiting Pickup" value={waitingPickupQueueCards.length} />
      </View>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Parcel Lookup</Text>
        <AppInput value={search} onChangeText={setSearch} placeholder="Search..." />
        <View style={styles.buttonRow}>
          <AppButton
            title={loading ? 'Searching...' : 'Search Parcels'}
            onPress={() => void handleSearch()}
            disabled={!canReadParcels || loading}
          />
          <AppButton
            title={loadingBoards ? 'Refreshing...' : 'Refresh Boards'}
            onPress={() => void loadQueueBoards()}
            variant="secondary"
            disabled={loadingBoards}
          />
        </View>
        {!canReadParcels ? (
          <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
            Parcel search is unavailable for your current permissions.
          </Text>
        ) : null}
      </AppCard>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Search Results</Text>
      {!canReadParcels ? (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          You do not have permission to view parcel search results.
        </Text>
      ) : loading ? (
        <View style={styles.listWrap}>
          <AppSkeletonCard lines={4} />
          <AppSkeletonCard lines={4} />
        </View>
      ) : !showSearchResults ? (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          Enter a booking code, customer name, or phone to begin.
        </Text>
      ) : rows.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          No matching parcel found. Try a different search term.
        </Text>
      ) : (
        <View style={styles.listWrap}>
          {rows.map((item) => (
            <ParcelCard
              key={item.id}
              parcel={item}
              onPress={() => void handleSelectParcel(item)}
              actionLabel="View Details"
            />
          ))}
        </View>
      )}

      {selectedParcel && canReadParcels ? (
        <AppCard>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Parcel Details</Text>
          <View style={styles.detailsList}>
            <DetailRow label="Booking" value={selectedParcel.bookingCode} first />
            <DetailRow
              label="Sender"
              value={`${selectedParcel.senderName ?? '-'} (${selectedParcel.senderPhone ?? '-'})`}
            />
            <DetailRow
              label="Receiver"
              value={`${selectedParcel.receiverName ?? '-'} (${selectedParcel.receiverPhone ?? '-'})`}
            />
            <DetailRow label="Details" value={selectedParcel.parcelDetails} />
            <DetailRow label="Content" value={selectedParcel.parcelContent ?? '-'} />
            <DetailRow label="Charge" value={formatCedis(selectedParcel.chargePsw)} />
            <DetailRow label="To Be Paid" value={formatCedis(selectedParcel.plannedToBePaidPsw)} />
            <DetailRow label="Status" value={<AppStatusChip label={selectedParcel.status} />} />
            <DetailRow
              label="Queue"
              value={
                selectedDetails?.pickupQueue?.queueCode ??
                selectedParcel.pickupQueueCode ??
                'Not queued'
              }
            />
            {selectedDetails?.pickupQueue?.queuedAt ? (
              <DetailRow
                label="Queued At"
                value={formatDate(selectedDetails.pickupQueue.queuedAt)}
              />
            ) : null}
            {selectedDetails?.delivery ? (
              <>
                <DetailRow label="Delivery Status" value={selectedDetails.delivery.status} />
                <DetailRow label="Dropoff" value={selectedDetails.delivery.dropoffAddress ?? '-'} />
                <DetailRow
                  label="Delivery Fee"
                  value={formatCedis(selectedDetails.delivery.chargePsw)}
                />
                <DetailRow
                  label="Delivery Paid"
                  value={formatCedis(selectedDetails.delivery.amountPaidPsw)}
                />
              </>
            ) : null}
            <DetailRow label="Payments" value={selectedDetails?.payments?.length ?? 0} />
          </View>

          {recentPayments.length > 0 ? (
            <View style={styles.paymentsList}>
              {recentPayments.map((payment) => (
                <Text
                  key={payment.id}
                  style={[styles.paymentLine, { color: theme.colors.textSubtle }]}
                >
                  {formatDate(payment.receivedAt)} · {formatCedis(payment.grossAmountPsw)}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <AppButton
              title={
                queueingParcelId === selectedParcel.id ? 'Issuing Ticket...' : 'Issue Queue Ticket'
              }
              disabled={!canIssueQueue || queueingParcelId === selectedParcel.id || !canIssueTicket}
              onPress={() => void handleQueue(selectedParcel.id)}
            />
            <AppButton
              title="Close Details"
              onPress={() => setSelectedParcel(null)}
              variant="secondary"
            />
          </View>
          {!canIssueQueue ? (
            <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
              Ticket can be issued only when queue code is not for today (or no queue exists).
            </Text>
          ) : null}
          {!canIssueTicket ? (
            <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
              You do not have permission to issue queue tickets.
            </Text>
          ) : null}
        </AppCard>
      ) : null}

      {canReadReceiverBoard ? (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Receiver Queue (To-Pay)
          </Text>
          {loadingBoards ? (
            <View style={styles.listWrap}>
              <AppSkeletonCard lines={4} />
              <AppSkeletonCard lines={4} />
            </View>
          ) : receiverQueueCards.length === 0 ? (
            <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
              No active receiver queue tickets right now.
            </Text>
          ) : (
            <View style={styles.listWrap}>
              {receiverQueueCards.map((card) => (
                <QueueCard
                  key={card.id}
                  card={card}
                  onCopy={() => void copyQueueCode(card.queueCode)}
                  onShare={() => void shareQueueCard(card, 'short')}
                />
              ))}
            </View>
          )}
        </>
      ) : null}

      {canReadSenderBoard ? (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Waiting Pickup (Sender-Paid)
          </Text>
          {loadingBoards ? (
            <View style={styles.listWrap}>
              <AppSkeletonCard lines={4} />
              <AppSkeletonCard lines={4} />
            </View>
          ) : waitingPickupQueueCards.length === 0 ? (
            <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
              No waiting pickup tickets at the moment.
            </Text>
          ) : (
            <View style={styles.listWrap}>
              {waitingPickupQueueCards.map((card) => (
                <QueueCard
                  key={card.id}
                  card={card}
                  onCopy={() => void copyQueueCode(card.queueCode)}
                  onShare={() => void shareQueueCard(card, 'short')}
                />
              ))}
            </View>
          )}
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  kpiRow: { flexDirection: 'row', gap: mobileSpacing.sm },
  sectionTitle: { ...mobileTextStyles.title3, marginTop: mobileSpacing.xs },
  cardTitle: { ...mobileTextStyles.headline },
  buttonRow: {
    flexDirection: 'row',
    gap: mobileSpacing.sm,
    marginTop: mobileSpacing.xs,
    flexWrap: 'wrap',
  },
  listWrap: { gap: mobileSpacing.sm + 2, paddingTop: mobileSpacing.xs },
  detailsList: { marginTop: -mobileSpacing.xs },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
  },
  detailLabel: { ...mobileTextStyles.subhead, flexShrink: 0 },
  detailValue: { ...mobileTextStyles.subhead, fontWeight: '600', flex: 1, textAlign: 'right' },
  detailValueWrap: { alignItems: 'flex-end' },
  paymentsList: { gap: 2 },
  paymentLine: { ...mobileTextStyles.footnote },
  empty: { ...mobileTextStyles.subhead, textAlign: 'center', marginTop: mobileSpacing.sm },
});
