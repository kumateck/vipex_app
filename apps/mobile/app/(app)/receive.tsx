import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from '@mobile/navigation/router-compat';
import { AppScreen } from '@mobile/components/screen';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import { searchParcels } from '@mobile/lib/api';
import { extractScannedCode } from '@mobile/lib/scan-code';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canMarkParcelArrived, canViewReceiveScreen } from '@mobile/lib/permissions';
import { hapticError, hapticSuccess, hapticTap, hapticWarning } from '@mobile/lib/haptics';
import { ParcelCard, ScannerView } from '@mobile/components/courier';
import { ReceiveScreenHeader } from '@mobile/features/receive';
import type { ReceiveMode } from '@mobile/features/receive';
import {
  AppButton,
  AppCard,
  AppInput,
  AppSkeletonCard,
  MobileNoAccess,
} from '@/components/ui/mobile';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export default function ReceiveScanScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canView = canViewReceiveScreen(permissions);
  const canMarkArrived = canMarkParcelArrived(permissions);
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const branchId = session.user?.branch?.id ?? session.user?.branchId;

  const [lastCode, setLastCode] = useState<string>('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [searchAllCompany, setSearchAllCompany] = useState(false);
  const [rows, setRows] = useState<ParcelSearchRow[]>([]);
  const [mode, setMode] = useState<ReceiveMode>('scan');
  const scanInFlightRef = useRef(false);

  const loadIncomingList = useCallback(async () => {
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
          pageSize: 20,
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
  }, [branchId, companyId, search, searchAllCompany, withAuth]);

  const receiveByCode = useCallback(
    async (rawCode: string) => {
      const code = extractScannedCode(rawCode);
      if (!companyId || !branchId) {
        Alert.alert('Missing context', 'User company or branch is missing.');
        void hapticWarning();
        return;
      }
      if (scanInFlightRef.current) return;
      scanInFlightRef.current = true;
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
          response.data.find((row) => row.bookingCode === code || row.trackingCode === code) ??
          response.data[0];

        if (!parcel) {
          notifyError('Not found', 'No in-transit parcel to your branch matches this code.');
          return;
        }

        notifySuccess(`Parcel ${parcel.bookingCode} ready for review.`);
        void hapticSuccess();
        router.push(`/(app)/receive-process/${parcel.id}`);
      } catch (err) {
        notifyError(
          'Receive failed',
          err instanceof Error ? err.message : 'Unable to receive parcel',
        );
        void hapticError();
      } finally {
        scanInFlightRef.current = false;
        setScanBusy(false);
      }
    },
    [branchId, companyId, withAuth],
  );

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access scan-to-receive." />
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={searchBusy} onRefresh={() => void loadIncomingList()}>
      <ReceiveScreenHeader
        mode={mode}
        onChangeMode={setMode}
        branchName={session.user?.branch?.name}
      />

      <View style={styles.overviewSection}>
        <View
          style={[
            styles.overview,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overview</Text>
          <View style={styles.incomingSummary}>
            <Text style={[styles.incomingCount, { color: theme.colors.secondary }]}>
              {rows.length}
            </Text>
            <Text style={[styles.incomingLabel, { color: theme.colors.textMuted }]}>
              Incoming Parcels
            </Text>
          </View>
        </View>
        <Text numberOfLines={2} style={[styles.lastScanText, { color: theme.colors.textSubtle }]}>
          Last scanned code: {lastCode || '-'}
        </Text>
      </View>

      {mode === 'scan' ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Scanner</Text>
          <ScannerView onCodeScanned={receiveByCode} />

          {scanBusy ? (
            <Text style={[styles.helperText, { color: theme.colors.textSubtle }]}>
              Processing scanned parcel...
            </Text>
          ) : null}
          {!canMarkArrived ? (
            <Text style={[styles.helperText, { color: theme.colors.textSubtle }]}>
              You can scan and review parcels, but cannot edit or confirm arrival.
            </Text>
          ) : null}
        </AppCard>
      ) : (
        <>
          <AppCard>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Incoming List And Search
            </Text>
            <AppInput value={search} onChangeText={setSearch} placeholder="Search..." />
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
                <ParcelCard
                  key={item.id}
                  parcel={item}
                  onPress={() => {
                    router.push(`/(app)/receive-process/${item.id}`);
                    void hapticTap();
                  }}
                  actionLabel="Review & Edit"
                />
              ))}
            </View>
          )}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  overviewSection: { gap: mobileSpacing.xs },
  overview: {
    minHeight: 64,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.md,
  },
  incomingSummary: { flexDirection: 'row', alignItems: 'baseline', gap: mobileSpacing.sm },
  incomingCount: { ...mobileTextStyles.title2, fontWeight: '800' },
  incomingLabel: { ...mobileTextStyles.caption1, fontWeight: '700' },
  lastScanText: { ...mobileTextStyles.caption2, paddingHorizontal: mobileSpacing.xs },
  sectionTitle: { ...mobileTextStyles.headline },
  helperText: { ...mobileTextStyles.subhead },
  buttonRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  listWrap: { gap: mobileSpacing.sm + 2, paddingTop: mobileSpacing.sm },
  empty: { ...mobileTextStyles.subhead, textAlign: 'center', marginTop: mobileSpacing.sm },
});
