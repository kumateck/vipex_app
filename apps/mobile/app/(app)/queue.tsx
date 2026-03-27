import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AppScreen } from '@/components/screen';
import { ParcelStatus } from '@/constants/parcel-status';
import {
  createPickupQueue,
  getParcelDetails,
  listPickupQueueCards,
  searchParcels,
} from '@/lib/api';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { ParcelFullDetails, ParcelSearchRow, PickupQueueCard } from '@/types/parcels';
import { useAuth } from '@/providers/auth-provider';

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

  const short = shortLines.join('\n');
  const full = fullLines.join('\n');

  return { short, full };
}

export default function QueueScreen() {
  const { session, withAuth } = useAuth();
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
    } finally {
      setLoadingBoards(false);
    }
  }

  async function handleSearch() {
    if (!companyId) {
      Alert.alert('Missing context', 'User company or branch is missing.');
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
    } catch (err) {
      notifyError('Search failed', err instanceof Error ? err.message : 'Unable to search parcels');
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
    }
  }

  async function handleQueue(parcelId: string) {
    try {
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
      } else {
        notifySuccess('Ticket created');
      }

      await handleSearch();
      await loadQueueBoards();
      if (selectedParcel?.id === parcelId) {
        const details = await withAuth((token) => getParcelDetails(token, parcelId));
        setSelectedDetails(details);
      }
    } catch (err) {
      notifyError('Queue failed', err instanceof Error ? err.message : 'Unable to queue parcel');
    }
  }

  async function copyQueueCode(queueCode: string) {
    try {
      await Clipboard.setStringAsync(queueCode);
      notifySuccess('Queue code copied.');
    } catch (err) {
      notifyError('Copy failed', err instanceof Error ? err.message : 'Unable to copy queue code');
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
    }
  }

  const showSearchResults = search.trim().length > 0;

  return (
    <AppScreen>
      <Text style={styles.title}>Queue Creation Master</Text>
      <TextInput
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Tracking / Booking / Customer / Phone"
      />
      <Button title={loading ? 'Searching...' : 'Super Search Parcel'} onPress={handleSearch} />

      <View style={styles.switcher}>
        <Button
          title={loadingBoards ? 'Refreshing...' : 'Refresh Queue Boards'}
          onPress={() => void loadQueueBoards()}
        />
      </View>

      <Text style={styles.sectionTitle}>Receiver Queue (TP)</Text>
      {receiverQueueCards.length === 0 ? (
        <Text style={styles.empty}>No active receiver queue cards.</Text>
      ) : (
        <View style={styles.listWrap}>
          {receiverQueueCards.map((card) => (
            <View key={card.id} style={styles.card}>
              <Text style={styles.bold}>{card.queueCode}</Text>
              <Text>
                {card.trackingCode} | {card.bookingCode}
              </Text>
              <Text>
                {card.receiverName ?? '-'} ({card.receiverPhone ?? '-'})
              </Text>
              <Text>{card.parcelDetails}</Text>
              <Text>Queued: {formatDate(card.queuedAt)}</Text>
              <View style={styles.switcher}>
                <Button title="Copy Code" onPress={() => void copyQueueCode(card.queueCode)} />
                <Button title="Share Ticket" onPress={() => void shareQueueCard(card, 'short')} />
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Waiting Pickup Queue (SP)</Text>
      {waitingPickupQueueCards.length === 0 ? (
        <Text style={styles.empty}>No active waiting pickup queue cards.</Text>
      ) : (
        <View style={styles.listWrap}>
          {waitingPickupQueueCards.map((card) => (
            <View key={card.id} style={styles.card}>
              <Text style={styles.bold}>{card.queueCode}</Text>
              <Text>
                {card.trackingCode} | {card.bookingCode}
              </Text>
              <Text>
                {card.receiverName ?? '-'} ({card.receiverPhone ?? '-'})
              </Text>
              <Text>{card.parcelDetails}</Text>
              <Text>Queued: {formatDate(card.queuedAt)}</Text>
              <View style={styles.switcher}>
                <Button title="Copy Code" onPress={() => void copyQueueCode(card.queueCode)} />
                <Button title="Share Ticket" onPress={() => void shareQueueCard(card, 'short')} />
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Parcel Super Search Results</Text>
      {!showSearchResults ? (
        <Text style={styles.empty}>
          Search for any parcel to see full details and queue action.
        </Text>
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>No parcels found.</Text>
      ) : (
        <View style={styles.listWrap}>
          {rows.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.bold}>{item.trackingCode}</Text>
              <Text>{item.bookingCode}</Text>
              <Text>
                {item.receiverName ?? '-'} ({item.receiverPhone ?? '-'})
              </Text>
              <Text>{item.parcelDetails}</Text>
              <Text>Status: {item.status}</Text>
              <Text>{item.pickupQueueCode ? `Queued: ${item.pickupQueueCode}` : 'Not queued'}</Text>
              <View style={styles.switcher}>
                <Button title="View Details" onPress={() => void handleSelectParcel(item)} />
              </View>
            </View>
          ))}
        </View>
      )}

      {selectedParcel ? (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Parcel Full Information</Text>
          <Text style={styles.detailsLine}>Tracking: {selectedParcel.trackingCode}</Text>
          <Text style={styles.detailsLine}>Booking: {selectedParcel.bookingCode}</Text>
          <Text style={styles.detailsLine}>
            Sender: {selectedParcel.senderName ?? '-'} ({selectedParcel.senderPhone ?? '-'})
          </Text>
          <Text style={styles.detailsLine}>
            Receiver: {selectedParcel.receiverName ?? '-'} ({selectedParcel.receiverPhone ?? '-'})
          </Text>
          <Text style={styles.detailsLine}>Details: {selectedParcel.parcelDetails}</Text>
          <Text style={styles.detailsLine}>Content: {selectedParcel.parcelContent ?? '-'}</Text>
          <Text style={styles.detailsLine}>Charge: {formatCedis(selectedParcel.chargePsw)}</Text>
          <Text style={styles.detailsLine}>
            To Be Paid: {formatCedis(selectedParcel.plannedToBePaidPsw)}
          </Text>
          <Text style={styles.detailsLine}>Status: {selectedParcel.status}</Text>
          <Text style={styles.detailsLine}>
            Queue:{' '}
            {selectedDetails?.pickupQueue?.queueCode ??
              selectedParcel.pickupQueueCode ??
              'Not queued'}
          </Text>
          {selectedDetails?.pickupQueue?.queuedAt ? (
            <Text style={styles.detailsLine}>
              Queued At: {formatDate(selectedDetails.pickupQueue.queuedAt)}
            </Text>
          ) : null}
          {selectedDetails?.delivery ? (
            <>
              <Text style={styles.detailsLine}>
                Delivery Status: {selectedDetails.delivery.status}
              </Text>
              <Text style={styles.detailsLine}>
                Dropoff: {selectedDetails.delivery.dropoffAddress ?? '-'}
              </Text>
              <Text style={styles.detailsLine}>
                Delivery Fee: {formatCedis(selectedDetails.delivery.chargePsw)}
              </Text>
              <Text style={styles.detailsLine}>
                Delivery Paid: {formatCedis(selectedDetails.delivery.amountPaidPsw)}
              </Text>
            </>
          ) : null}
          <Text style={styles.detailsLine}>Payments: {selectedDetails?.payments?.length ?? 0}</Text>
          {(selectedDetails?.payments ?? []).slice(0, 3).map((payment) => (
            <Text key={payment.id} style={styles.detailsLine}>
              - {formatDate(payment.receivedAt)} | {formatCedis(payment.grossAmountPsw)}
            </Text>
          ))}
          <View style={styles.switcher}>
            <Button
              title="Create Queue"
              disabled={!canIssueQueue}
              onPress={() => void handleQueue(selectedParcel.id)}
            />
            <Button title="Close Details" onPress={() => setSelectedParcel(null)} />
          </View>
          {!canIssueQueue ? (
            <Text style={styles.empty}>
              Queue can only be created for awaiting-pickup parcels without active ticket.
            </Text>
          ) : null}
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  switcher: { flexDirection: 'row', gap: 8, marginTop: 4 },
  listWrap: { gap: 10, paddingTop: 8 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  detailsTitle: { fontSize: 16, fontWeight: '700' },
  detailsLine: { color: '#344054' },
  bold: { fontWeight: '700' },
  empty: { color: '#667085', textAlign: 'center', marginTop: 18 },
});
