import { useEffect, useMemo, useState } from 'react';
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
import {
  AppButton,
  AppCard,
  AppInput,
  AppSkeletonCard,
  AppStatusChip,
  MobileNoAccess,
} from '@/components/ui/mobile';
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

function buildQueueShareMessages(input: {
  queueCode: string;
  trackingCode?: string | null;
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
  const trackingCode = input.trackingCode ?? '-';
  const bookingCode = input.bookingCode ?? '-';
  const branchName = input.branchName ?? '-';
  const branchContact = input.branchContact?.trim();
  const branchLocation = input.branchLocation?.trim();
  const companyName = input.companyName ?? 'Vipex';
  const queueCode = input.queueCode;

  const shortLines = [
    `${companyName} Queue Ticket`,
    `Code: ${queueCode}`,
    `Tracking: ${trackingCode}`,
    `Receiver: ${receiverName}`,
    `Branch: ${branchName}`,
  ];
  if (branchContact) shortLines.push(`Branch Contact: ${branchContact}`);
  if (branchLocation) shortLines.push(`Branch Location: ${branchLocation}`);

  const fullLines = [
    `Queue Ticket: ${queueCode}`,
    `Tracking Code: ${trackingCode}`,
    `Booking Code: ${bookingCode}`,
    `Receiver: ${receiverName} (${receiverPhone})`,
    `Branch: ${branchName}`,
  ];
  if (branchContact) fullLines.push(`Branch Contact: ${branchContact}`);
  if (branchLocation) fullLines.push(`Branch Location: ${branchLocation}`);
  fullLines.push('Please present this queue code at pickup.');

  return { short: shortLines.join('\n'), full: fullLines.join('\n') };
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
    return (
      selectedParcel.status === ParcelStatus.AWAITING_PICKUP && !selectedDetails?.pickupQueue?.id
    );
  }, [selectedDetails?.pickupQueue?.id, selectedParcel]);

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
          trackingCode: parcelContext?.trackingCode,
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
      trackingCode: card.trackingCode,
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

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access queue operations." />
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={loadingBoards} onRefresh={() => void loadQueueBoards()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Queue Operations</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Search parcels fast, issue queue tickets, and monitor active boards.
      </Text>

      <View style={styles.kpiRow}>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>Receiver Queue</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {receiverQueueCards.length}
          </Text>
        </View>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>Waiting Pickup</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {waitingPickupQueueCards.length}
          </Text>
        </View>
      </View>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Parcel Lookup</Text>
        <AppInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tracking / Booking / Customer / Phone"
        />
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

      {canReadReceiverBoard ? (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
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
                <AppCard key={card.id}>
                  <Text style={[styles.bold, { color: theme.colors.text }]}>{card.queueCode}</Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    {card.trackingCode} | {card.bookingCode}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    {card.receiverName ?? '-'} ({card.receiverPhone ?? '-'})
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>{card.parcelDetails}</Text>
                  <Text style={{ color: theme.colors.textSubtle }}>
                    Queued: {formatDate(card.queuedAt)}
                  </Text>
                  <AppStatusChip
                    label={card.paymentBucket === 'TP' ? 'To Be Paid' : 'Sender Paid'}
                  />
                  <View style={styles.buttonRow}>
                    <AppButton
                      title="Copy Code"
                      onPress={() => void copyQueueCode(card.queueCode)}
                      variant="secondary"
                    />
                    <AppButton
                      title="Share Ticket"
                      onPress={() => void shareQueueCard(card, 'short')}
                    />
                  </View>
                </AppCard>
              ))}
            </View>
          )}
        </>
      ) : null}

      {canReadSenderBoard ? (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
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
                <AppCard key={card.id}>
                  <Text style={[styles.bold, { color: theme.colors.text }]}>{card.queueCode}</Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    {card.trackingCode} | {card.bookingCode}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    {card.receiverName ?? '-'} ({card.receiverPhone ?? '-'})
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>{card.parcelDetails}</Text>
                  <Text style={{ color: theme.colors.textSubtle }}>
                    Queued: {formatDate(card.queuedAt)}
                  </Text>
                  <AppStatusChip
                    label={card.paymentBucket === 'SP' ? 'Sender Paid' : 'To Be Paid'}
                  />
                  <View style={styles.buttonRow}>
                    <AppButton
                      title="Copy Code"
                      onPress={() => void copyQueueCode(card.queueCode)}
                      variant="secondary"
                    />
                    <AppButton
                      title="Share Ticket"
                      onPress={() => void shareQueueCard(card, 'short')}
                    />
                  </View>
                </AppCard>
              ))}
            </View>
          )}
        </>
      ) : null}

      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Search Results</Text>
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
          Enter tracking, booking, customer name, or phone to begin.
        </Text>
      ) : rows.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          No matching parcel found. Try a different search term.
        </Text>
      ) : (
        <View style={styles.listWrap}>
          {rows.map((item) => (
            <AppCard key={item.id}>
              <Text style={[styles.bold, { color: theme.colors.text }]}>{item.trackingCode}</Text>
              <Text style={{ color: theme.colors.textMuted }}>{item.bookingCode}</Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {item.receiverName ?? '-'} ({item.receiverPhone ?? '-'})
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>{item.parcelDetails}</Text>
              <AppStatusChip label={item.status} />
              <Text style={{ color: theme.colors.textSubtle }}>
                {item.pickupQueueCode ? `Queued: ${item.pickupQueueCode}` : 'Not queued'}
              </Text>
              <AppButton
                title="View Details"
                onPress={() => void handleSelectParcel(item)}
                variant="secondary"
              />
            </AppCard>
          ))}
        </View>
      )}

      {selectedParcel && canReadParcels ? (
        <AppCard>
          <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>Parcel Details</Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Tracking: {selectedParcel.trackingCode}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Booking: {selectedParcel.bookingCode}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Sender: {selectedParcel.senderName ?? '-'} ({selectedParcel.senderPhone ?? '-'})
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Receiver: {selectedParcel.receiverName ?? '-'} ({selectedParcel.receiverPhone ?? '-'})
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Details: {selectedParcel.parcelDetails}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Content: {selectedParcel.parcelContent ?? '-'}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Charge: {formatCedis(selectedParcel.chargePsw)}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            To Be Paid: {formatCedis(selectedParcel.plannedToBePaidPsw)}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Status: {selectedParcel.status}
          </Text>
          <AppStatusChip label={selectedParcel.status} />
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Queue:{' '}
            {selectedDetails?.pickupQueue?.queueCode ??
              selectedParcel.pickupQueueCode ??
              'Not queued'}
          </Text>
          {selectedDetails?.pickupQueue?.queuedAt ? (
            <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
              Queued At: {formatDate(selectedDetails.pickupQueue.queuedAt)}
            </Text>
          ) : null}
          {selectedDetails?.delivery ? (
            <>
              <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
                Delivery Status: {selectedDetails.delivery.status}
              </Text>
              <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
                Dropoff: {selectedDetails.delivery.dropoffAddress ?? '-'}
              </Text>
              <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
                Delivery Fee: {formatCedis(selectedDetails.delivery.chargePsw)}
              </Text>
              <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
                Delivery Paid: {formatCedis(selectedDetails.delivery.amountPaidPsw)}
              </Text>
            </>
          ) : null}
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Payments: {selectedDetails?.payments?.length ?? 0}
          </Text>
          {(selectedDetails?.payments ?? []).slice(0, 3).map((payment) => (
            <Text key={payment.id} style={[styles.detailsLine, { color: theme.colors.textSubtle }]}>
              - {formatDate(payment.receivedAt)} | {formatCedis(payment.grossAmountPsw)}
            </Text>
          ))}
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
              Ticket can be issued only for awaiting-pickup parcels without an active queue code.
            </Text>
          ) : null}
          {!canIssueTicket ? (
            <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
              You do not have permission to issue queue tickets.
            </Text>
          ) : null}
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginBottom: mobileSpacing.xs, lineHeight: 20 },
  kpiRow: { flexDirection: 'row', gap: mobileSpacing.sm },
  kpiTile: { flex: 1, borderWidth: 1, borderRadius: 16, padding: mobileSpacing.md },
  kpiLabel: { fontSize: mobileTypography.caption, fontWeight: '600' },
  kpiValue: { fontSize: mobileTypography.kpi, fontWeight: '800', marginTop: 1 },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700', marginTop: 6 },
  buttonRow: {
    flexDirection: 'row',
    gap: mobileSpacing.sm,
    marginTop: mobileSpacing.xs,
    flexWrap: 'wrap',
  },
  listWrap: { gap: mobileSpacing.sm + 2, paddingTop: mobileSpacing.sm },
  detailsTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  detailsLine: {},
  bold: { fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: mobileSpacing.sm },
});
