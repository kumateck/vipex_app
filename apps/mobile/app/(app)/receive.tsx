import { useMemo, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { AppScreen } from '@/components/screen';
import { ParcelStatus } from '@/constants/parcel-status';
import { searchParcels, updateParcelStatus } from '@/lib/api';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { ParcelSearchRow } from '@/types/parcels';
import { useAuth } from '@/providers/auth-provider';

export default function ReceiveScanScreen() {
  const { session, withAuth } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const branchId = session.user?.branch?.id ?? session.user?.branchId;

  const [permission, requestPermission] = useCameraPermissions();
  const [lastCode, setLastCode] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [searchAllCompany, setSearchAllCompany] = useState(false);
  const [rows, setRows] = useState<ParcelSearchRow[]>([]);

  const canScan = useMemo(() => permission?.granted ?? false, [permission?.granted]);

  async function loadIncomingList() {
    if (!companyId) {
      Alert.alert('Missing context', 'User company is missing.');
      return;
    }
    setBusy(true);
    try {
      const response = await withAuth((token) =>
        searchParcels(token, {
          search: search.trim(),
          companyId,
          destinationId: searchAllCompany ? undefined : (branchId ?? undefined),
          status: ParcelStatus.IN_TRANSIT,
          page: 1,
          pageSize: 50,
        }),
      );
      setRows(response.data ?? []);
    } catch (err) {
      notifyError('Search failed', err instanceof Error ? err.message : 'Unable to search parcels');
    } finally {
      setBusy(false);
    }
  }

  async function receiveByCode(code: string) {
    if (!companyId || !branchId) {
      Alert.alert('Missing context', 'User company or branch is missing.');
      return;
    }
    if (busy) return;
    setBusy(true);
    setLastCode(code);

    try {
      const response = await withAuth((token) =>
        searchParcels(token, {
          search: code,
          companyId,
          destinationId: branchId,
          status: ParcelStatus.IN_TRANSIT,
          page: 1,
          pageSize: 20,
        }),
      );

      const parcel =
        response.data.find((row) => row.trackingCode === code || row.bookingCode === code) ??
        response.data[0];

      if (!parcel) {
        notifyError('Not found', 'No in-transit parcel to your branch matches this code.');
        return;
      }

      await withAuth((token) =>
        updateParcelStatus(token, parcel.id, ParcelStatus.ARRIVED_AT_DESTINATION),
      );
      notifySuccess(`Parcel ${parcel.trackingCode} marked ARRIVED_AT_DESTINATION.`);
      await loadIncomingList();
    } catch (err) {
      notifyError(
        'Receive failed',
        err instanceof Error ? err.message : 'Unable to receive parcel',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleBarcode(result: BarcodeScanningResult) {
    const code = result.data?.trim();
    if (!code) return;
    await receiveByCode(code);
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Scan To Receive (Incoming In-Transit)</Text>
      <Text style={styles.meta}>Destination branch: {session.user?.branch?.name ?? '-'}</Text>

      {!permission ? <Text>Checking camera permission...</Text> : null}
      {permission && !canScan ? (
        <Button title="Allow camera" onPress={() => void requestPermission()} />
      ) : null}

      {canScan ? (
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarcode}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        </View>
      ) : null}

      <Text>Last scan: {lastCode || '-'}</Text>

      <Text style={styles.sectionTitle}>Incoming List + Super Search</Text>
      <TextInput
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Tracking / Booking / Sender / Receiver / Phone"
      />
      <View style={styles.switcher}>
        <Button
          title={searchAllCompany ? 'Search Scope: All Branches' : 'Search Scope: My Branch'}
          onPress={() => setSearchAllCompany((prev) => !prev)}
        />
      </View>
      <Button
        title={busy ? 'Searching...' : 'Search In-Transit Incoming'}
        onPress={() => void loadIncomingList()}
        disabled={busy}
      />

      {rows.length === 0 ? (
        <Text style={styles.empty}>No incoming parcels yet.</Text>
      ) : (
        <View style={styles.listWrap}>
          {rows.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.bold}>{item.trackingCode}</Text>
              <Text>{item.bookingCode}</Text>
              <Text>
                {item.senderName ?? '-'} ({item.senderPhone ?? '-'})
              </Text>
              <Text>
                {item.receiverName ?? '-'} ({item.receiverPhone ?? '-'})
              </Text>
              <Text>{item.parcelDetails}</Text>
              <Text>Status: {item.status}</Text>
              <View style={styles.switcher}>
                <Button
                  title="View Details"
                  onPress={() => router.push(`/(app)/receive-process/${item.id}`)}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  meta: { color: '#475467' },
  cameraWrap: {
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d0d5dd',
  },
  camera: { flex: 1 },
  switcher: { flexDirection: 'row', gap: 8, marginTop: 4 },
  listWrap: { gap: 10, paddingTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  bold: { fontWeight: '700' },
  empty: { color: '#667085', textAlign: 'center', marginTop: 18 },
});
