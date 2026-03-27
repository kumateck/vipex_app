import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppScreen } from '@/components/screen';
import { ParcelStatus } from '@/constants/parcel-status';
import {
  getParcelDetails,
  searchParcels,
  updateCustomer,
  updateParcel,
  updateParcelStatus,
} from '@/lib/api';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { ParcelFullDetails, ParcelSearchRow } from '@/types/parcels';
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

export default function ReceiveProcessParcelScreen() {
  const { session, withAuth } = useAuth();
  const router = useRouter();
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
  const companyId = session.user?.company?.id ?? session.user?.companyId;

  const [busy, setBusy] = useState(false);
  const [parcel, setParcel] = useState<ParcelSearchRow | null>(null);
  const [details, setDetails] = useState<ParcelFullDetails | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editParcelDetails, setEditParcelDetails] = useState('');
  const [editParcelContent, setEditParcelContent] = useState('');
  const [editReceiverName, setEditReceiverName] = useState('');
  const [editReceiverPhone, setEditReceiverPhone] = useState('');

  async function loadParcel() {
    if (!parcelId || !companyId) return;
    setBusy(true);
    setInitialLoading(true);
    try {
      const detailsPayload = await withAuth((token) => getParcelDetails(token, parcelId));
      setDetails(detailsPayload);

      const searchPayload = await withAuth((token) =>
        searchParcels(token, {
          search: detailsPayload.parcel.trackingCode,
          companyId,
          page: 1,
          pageSize: 20,
        }),
      );
      const row = searchPayload.data.find((item) => item.id === parcelId) ?? null;
      setParcel(row);

      setEditParcelDetails(row?.parcelDetails ?? detailsPayload.parcel.parcelDetails ?? '');
      setEditParcelContent(row?.parcelContent ?? detailsPayload.parcel.parcelContent ?? '');
      setEditReceiverName(row?.receiverName ?? '');
      setEditReceiverPhone(row?.receiverPhone ?? '');
    } catch (err) {
      notifyError(
        'Load failed',
        err instanceof Error ? err.message : 'Unable to load parcel details',
      );
    } finally {
      setBusy(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    void loadParcel();
  }, [parcelId, companyId]);

  async function saveIncomingEdits() {
    if (!parcelId || !parcel) return;
    const receiverId = parcel.receiverId;
    const parcelDetailsValue = editParcelDetails.trim();
    const receiverNameValue = editReceiverName.trim();
    const receiverPhoneValue = editReceiverPhone.trim();

    if (!parcelDetailsValue) {
      Alert.alert('Validation', 'Parcel details is required.');
      return;
    }
    if (!receiverNameValue) {
      Alert.alert('Validation', 'Receiver name is required.');
      return;
    }

    try {
      setBusy(true);
      await withAuth(async (token) => {
        const tasks: Array<Promise<unknown>> = [];
        if (
          parcelDetailsValue !== (parcel.parcelDetails ?? '').trim() ||
          editParcelContent.trim() !== (parcel.parcelContent ?? '').trim()
        ) {
          tasks.push(
            updateParcel(token, {
              id: parcelId,
              parcelDetails: parcelDetailsValue,
              parcelContent: editParcelContent.trim(),
            }),
          );
        }

        if (receiverId) {
          if (
            receiverNameValue !== (parcel.receiverName ?? '').trim() ||
            receiverPhoneValue !== (parcel.receiverPhone ?? '').trim()
          ) {
            tasks.push(
              updateCustomer(token, {
                id: receiverId,
                fullname: receiverNameValue,
                telephone: receiverPhoneValue || null,
              }),
            );
          }
        }

        if (tasks.length === 0) return;
        await Promise.all(tasks);
      });
      notifySuccess('Incoming parcel fields updated.');
      await loadParcel();
    } catch (err) {
      notifyError('Save failed', err instanceof Error ? err.message : 'Unable to save changes');
    } finally {
      setBusy(false);
    }
  }

  async function markArrived() {
    if (!parcelId || !parcel) return;
    try {
      setBusy(true);
      await withAuth((token) =>
        updateParcelStatus(token, parcelId, ParcelStatus.ARRIVED_AT_DESTINATION),
      );
      notifySuccess(`Parcel ${parcel.trackingCode} marked ARRIVED_AT_DESTINATION.`);
      await loadParcel();
    } catch (err) {
      notifyError(
        'Mark arrived failed',
        err instanceof Error ? err.message : 'Unable to update parcel status',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Process Incoming Parcel</Text>
      {initialLoading ? (
        <View style={styles.detailsCard}>
          <View style={styles.skeletonLineLong} />
          <View style={styles.skeletonLineMedium} />
          <View style={styles.skeletonLineLong} />
          <View style={styles.skeletonLineLong} />
          <View style={styles.skeletonLineMedium} />
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading parcel details...</Text>
          </View>
        </View>
      ) : null}
      {!initialLoading && !parcel ? <Text style={styles.empty}>Parcel not found.</Text> : null}
      {parcel ? (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsLine}>Tracking: {parcel.trackingCode}</Text>
          <Text style={styles.detailsLine}>Booking: {parcel.bookingCode}</Text>
          <Text style={styles.detailsLine}>
            Sender: {parcel.senderName ?? '-'} ({parcel.senderPhone ?? '-'})
          </Text>
          <Text style={styles.detailsLine}>
            Receiver: {parcel.receiverName ?? '-'} ({parcel.receiverPhone ?? '-'})
          </Text>
          <Text style={styles.detailsLine}>
            Charge: {formatCedis(parcel.chargePsw)} | To Be Paid:{' '}
            {formatCedis(parcel.plannedToBePaidPsw)}
          </Text>
          <Text style={styles.detailsLine}>Pickup Queue: {parcel.pickupQueueCode ?? '-'}</Text>
          {details?.pickupQueue?.queuedAt ? (
            <Text style={styles.detailsLine}>
              Queued At: {formatDate(details.pickupQueue.queuedAt)}
            </Text>
          ) : null}
          {details?.delivery ? (
            <Text style={styles.detailsLine}>
              Delivery: {details.delivery.status} | {details.delivery.dropoffAddress ?? '-'}
            </Text>
          ) : null}
          <Text style={styles.editLabel}>Parcel Details</Text>
          <TextInput
            style={styles.input}
            value={editParcelDetails}
            onChangeText={setEditParcelDetails}
          />
          <Text style={styles.editLabel}>Parcel Content</Text>
          <TextInput
            style={styles.input}
            value={editParcelContent}
            onChangeText={setEditParcelContent}
          />
          <Text style={styles.editLabel}>Receiver Fullname</Text>
          <TextInput
            style={styles.input}
            value={editReceiverName}
            onChangeText={setEditReceiverName}
          />
          <Text style={styles.editLabel}>Receiver Telephone</Text>
          <TextInput
            style={styles.input}
            value={editReceiverPhone}
            onChangeText={setEditReceiverPhone}
          />
          <View style={styles.switcher}>
            <Button
              title="Save Incoming Edits"
              onPress={() => void saveIncomingEdits()}
              disabled={busy}
            />
            <Button title="Mark Arrived" onPress={() => void markArrived()} disabled={busy} />
          </View>
          <View style={styles.switcher}>
            <Button title="Back" onPress={() => router.back()} />
          </View>
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700' },
  switcher: { flexDirection: 'row', gap: 8, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginTop: 6,
  },
  detailsLine: { color: '#344054' },
  editLabel: { fontSize: 12, color: '#475467', marginTop: 2 },
  empty: { color: '#667085', textAlign: 'center', marginTop: 18 },
  loadingRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#667085',
    fontSize: 13,
  },
  skeletonLineLong: {
    height: 14,
    borderRadius: 8,
    backgroundColor: '#eaecf0',
    width: '100%',
  },
  skeletonLineMedium: {
    height: 14,
    borderRadius: 8,
    backgroundColor: '#eaecf0',
    width: '70%',
  },
});
