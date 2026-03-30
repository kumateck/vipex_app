import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { AppScreen } from '@/components/screen';
import { ParcelStatus } from '@/constants/parcel-status';
import { searchParcels, updateParcelStatus } from '@/lib/api';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { ParcelSearchRow } from '@/types/parcels';
import { useAuth } from '@/providers/auth-provider';
import { useAppearance } from '@/providers/appearance-provider';
import { canMarkParcelArrived, canViewReceiveScreen } from '@/lib/permissions';
import { hapticError, hapticSuccess, hapticTap, hapticWarning } from '@/lib/haptics';
import {
  AppButton,
  AppCard,
  AppInput,
  AppSkeletonCard,
  AppStatusChip,
  MobileNoAccess,
} from '@/components/ui';
import { mobileSpacing, mobileTypography } from '@/theme/layout';

export default function ReceiveScanScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canView = canViewReceiveScreen(permissions);
  const canMarkArrived = canMarkParcelArrived(permissions);
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const branchId = session.user?.branch?.id ?? session.user?.branchId;

  const [permission, requestPermission] = useCameraPermissions();
  const [lastCode, setLastCode] = useState<string>('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [searchAllCompany, setSearchAllCompany] = useState(false);
  const [rows, setRows] = useState<ParcelSearchRow[]>([]);

  const canScan = useMemo(() => permission?.granted ?? false, [permission?.granted]);

  async function loadIncomingList() {
    if (!companyId) {
      Alert.alert('Missing context', 'User company is missing.');
      void hapticWarning();
      return;
    }
    setSearchBusy(true);
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
      void hapticTap();
    } catch (err) {
      notifyError('Search failed', err instanceof Error ? err.message : 'Unable to search parcels');
      void hapticError();
    } finally {
      setSearchBusy(false);
    }
  }

  async function receiveByCode(code: string) {
    if (!companyId || !branchId) {
      Alert.alert('Missing context', 'User company or branch is missing.');
      void hapticWarning();
      return;
    }
    if (scanBusy) return;
    if (!canMarkArrived) {
      notifyError('Permission denied', 'You do not have permission to mark parcels arrived.');
      void hapticWarning();
      return;
    }
    setScanBusy(true);
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
      void hapticSuccess();
      await loadIncomingList();
    } catch (err) {
      notifyError(
        'Receive failed',
        err instanceof Error ? err.message : 'Unable to receive parcel',
      );
      void hapticError();
    } finally {
      setScanBusy(false);
    }
  }

  async function handleBarcode(result: BarcodeScanningResult) {
    const code = result.data?.trim();
    if (!code) return;
    await receiveByCode(code);
  }

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access scan-to-receive." />
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={searchBusy} onRefresh={() => void loadIncomingList()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Scan To Receive</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Scan incoming in-transit parcels for {session.user?.branch?.name ?? '-'}.
      </Text>

      <View style={styles.kpiRow}>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>
            Incoming Parcels
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>{rows.length}</Text>
        </View>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>
            Last Scanned Code
          </Text>
          <Text style={[styles.kpiLastCode, { color: theme.colors.text }]} numberOfLines={1}>
            {lastCode || '-'}
          </Text>
        </View>
      </View>

      <AppCard>
        {!permission ? (
          <Text style={{ color: theme.colors.textMuted }}>Checking camera permissions...</Text>
        ) : null}
        {permission && !canScan ? (
          <AppButton title="Enable Camera Access" onPress={() => void requestPermission()} />
        ) : null}

        {canScan ? (
          <View style={[styles.cameraWrap, { borderColor: theme.colors.border }]}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarcode}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
          </View>
        ) : null}

        {scanBusy ? (
          <Text style={{ color: theme.colors.textSubtle }}>Processing scanned parcel...</Text>
        ) : null}
        <Text style={{ color: theme.colors.textSubtle }}>Most recent scan: {lastCode || '-'}</Text>
        {!canMarkArrived ? (
          <Text style={{ color: theme.colors.textSubtle }}>
            You can scan and view parcels, but cannot mark arrival.
          </Text>
        ) : null}
      </AppCard>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
          Incoming List And Search
        </Text>
        <AppInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tracking / Booking / Sender / Receiver / Phone"
        />
        <View style={styles.buttonRow}>
          <AppButton
            title={searchAllCompany ? 'Scope: All Branches' : 'Scope: My Branch'}
            onPress={() => setSearchAllCompany((prev) => !prev)}
            variant="secondary"
          />
          <AppButton
            title={searchBusy ? 'Searching...' : 'Search Incoming Parcels'}
            onPress={() => void loadIncomingList()}
            disabled={searchBusy}
          />
        </View>
      </AppCard>

      {searchBusy ? (
        <View style={styles.listWrap}>
          <AppSkeletonCard lines={4} />
          <AppSkeletonCard lines={4} />
        </View>
      ) : rows.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          No incoming in-transit parcels found yet.
        </Text>
      ) : (
        <View style={styles.listWrap}>
          {rows.map((item) => (
            <AppCard key={item.id}>
              <Text style={[styles.bold, { color: theme.colors.text }]}>{item.trackingCode}</Text>
              <Text style={{ color: theme.colors.textMuted }}>{item.bookingCode}</Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {item.senderName ?? '-'} ({item.senderPhone ?? '-'})
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {item.receiverName ?? '-'} ({item.receiverPhone ?? '-'})
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>{item.parcelDetails}</Text>
              <AppStatusChip label={item.status} />
              <AppButton
                title="View Details"
                onPress={() => {
                  router.push(`/(app)/receive-process/${item.id}`);
                  void hapticTap();
                }}
                variant="secondary"
              />
            </AppCard>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  kpiRow: { flexDirection: 'row', gap: mobileSpacing.sm },
  kpiTile: { flex: 1, borderWidth: 1, borderRadius: 16, padding: mobileSpacing.md },
  kpiLabel: { fontSize: mobileTypography.caption, fontWeight: '600' },
  kpiValue: { fontSize: mobileTypography.kpi, fontWeight: '800', marginTop: 2 },
  kpiLastCode: { fontSize: 14, fontWeight: '700', marginTop: 6 },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  cameraWrap: {
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  camera: { flex: 1 },
  buttonRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  listWrap: { gap: mobileSpacing.sm + 2, paddingTop: mobileSpacing.sm },
  bold: { fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: mobileSpacing.sm },
});
