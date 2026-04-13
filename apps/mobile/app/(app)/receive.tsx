import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { AppScreen } from '@mobile/components/screen';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import { searchParcels, updateParcelStatus } from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canMarkParcelArrived, canViewReceiveScreen } from '@mobile/lib/permissions';
import { hapticError, hapticSuccess, hapticTap, hapticWarning } from '@mobile/lib/haptics';
import { ParcelCard, ScannerView, StatCard } from '@mobile/components/courier';
import {
  AppButton,
  AppCard,
  AppInput,
  AppSkeletonCard,
  MobileNoAccess,
} from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

type ReceiveMode = 'scan' | 'manual';

export default function ReceiveScanScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const navigation = useNavigation();
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

      const parcel = response.data.find((row) => row.bookingCode === code) ?? response.data[0];

      if (!parcel) {
        notifyError('Not found', 'No in-transit parcel to your branch matches this code.');
        return;
      }

      await withAuth((token) =>
        updateParcelStatus(token, parcel.id, ParcelStatus.ARRIVED_AT_DESTINATION),
      );
      notifySuccess(`Parcel ${parcel.bookingCode} marked ARRIVED_AT_DESTINATION.`);
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

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access scan-to-receive." />
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={searchBusy} onRefresh={() => void loadIncomingList()}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <View style={styles.titleRow}>
            <Pressable
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={styles.menuButton}
              accessibilityRole="button"
              accessibilityLabel="Open side menu"
            >
              <Ionicons name="menu-outline" size={22} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Parcel Scanner</Text>
          </View>
          <Text style={[styles.pageSubtitle, { color: theme.colors.textSubtle }]}>
            Mark as received • {session.user?.branch?.name ?? '-'}
          </Text>
        </View>
        <View style={styles.modeTabs}>
          <Pressable
            onPress={() => setMode('scan')}
            style={[
              styles.modeTabButton,
              {
                borderColor: mode === 'scan' ? theme.colors.primary : theme.colors.border,
                backgroundColor: mode === 'scan' ? theme.colors.primary : theme.colors.card,
              },
            ]}
          >
            <Ionicons
              name="qr-code-outline"
              size={16}
              color={mode === 'scan' ? theme.colors.primaryText : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.modeTabLabel,
                { color: mode === 'scan' ? theme.colors.primaryText : theme.colors.textMuted },
              ]}
            >
              Scan
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('manual')}
            style={[
              styles.modeTabButton,
              {
                borderColor: mode === 'manual' ? theme.colors.primary : theme.colors.border,
                backgroundColor: mode === 'manual' ? theme.colors.primary : theme.colors.card,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={mode === 'manual' ? theme.colors.primaryText : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.modeTabLabel,
                { color: mode === 'manual' ? theme.colors.primaryText : theme.colors.textMuted },
              ]}
            >
              Manual
            </Text>
          </Pressable>
        </View>
      </View>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overview</Text>
        <View style={styles.kpiRow}>
          <StatCard label="Incoming Parcels" value={rows.length} />
          <StatCard label="Last Scanned Code" value={lastCode || '-'} />
        </View>
      </AppCard>

      {mode === 'scan' ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Scanner</Text>
          <ScannerView onCodeScanned={(code) => void receiveByCode(code)} />

          {scanBusy ? (
            <Text style={{ color: theme.colors.textSubtle }}>Processing scanned parcel...</Text>
          ) : null}
          <Text style={{ color: theme.colors.textSubtle }}>
            Most recent scan: {lastCode || '-'}
          </Text>
          {!canMarkArrived ? (
            <Text style={{ color: theme.colors.textSubtle }}>
              You can scan and view parcels, but cannot mark arrival.
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
                  actionLabel="View Details"
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
  },
  titleWrap: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuButton: { paddingHorizontal: 4, paddingVertical: 2 },
  pageTitle: { fontSize: mobileTypography.title, fontWeight: '800' },
  pageSubtitle: { fontSize: mobileTypography.subtitle, lineHeight: 20 },
  modeTabs: { flexDirection: 'row', gap: 6 },
  modeTabButton: {
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  modeTabLabel: { fontSize: 11, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', gap: mobileSpacing.sm },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  listWrap: { gap: mobileSpacing.sm + 2, paddingTop: mobileSpacing.sm },
  empty: { textAlign: 'center', marginTop: mobileSpacing.sm },
});
