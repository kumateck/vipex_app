import { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from '@mobile/navigation/router-compat';
import { AppScreen } from '@mobile/components/screen';
import { ScannerView } from '@mobile/components/courier';
import {
  closeConsignment,
  getConsignmentDetail,
  listConsignmentItems,
  receiveConsignmentItem,
  ApiRequestError,
  type ConsignmentDetail,
  type ConsignmentItem,
} from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canMarkParcelArrived, canViewReceiveScreen } from '@mobile/lib/permissions';
import { hapticError, hapticSuccess, hapticTap, hapticWarning } from '@mobile/lib/haptics';
import { AppButton, AppCard, AppInput, AppLabel, MobileNoAccess } from '@/components/ui/mobile';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

const CONSIGNMENT_STATUS = { OPEN: 0, CLOSED: 1, CLOSED_WITH_EXCEPTIONS: 2 } as const;

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export default function ReceiveConsignmentSessionScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canView = canViewReceiveScreen(permissions);
  const canReceive = canMarkParcelArrived(permissions);
  const router = useRouter();
  const { consignmentId } = useLocalSearchParams<{ consignmentId: string }>();

  const [consignment, setConsignment] = useState<ConsignmentDetail | null>(null);
  const [items, setItems] = useState<ConsignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [scanBusy, setScanBusy] = useState(false);
  const [closeBusy, setCloseBusy] = useState(false);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [missingCount, setMissingCount] = useState(0);
  const [exceptionReason, setExceptionReason] = useState('');

  const load = useCallback(async () => {
    if (!consignmentId) return;
    setLoading(true);
    try {
      const [detail, itemRows] = await withAuth((token) =>
        Promise.all([
          getConsignmentDetail(token, consignmentId),
          listConsignmentItems(token, consignmentId),
        ]),
      );
      setConsignment(detail);
      setItems(itemRows);
    } catch (err) {
      notifyError('Load failed', err instanceof Error ? err.message : 'Unable to load consignment');
    } finally {
      setLoading(false);
    }
  }, [consignmentId, withAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  const isOpen = consignment?.status === CONSIGNMENT_STATUS.OPEN;

  const receiveByCode = useCallback(
    async (code: string) => {
      if (!consignmentId || !isOpen) return;
      if (!canReceive) {
        notifyError('Permission denied', 'You do not have permission to receive parcels.');
        void hapticWarning();
        return;
      }
      setScanBusy(true);
      try {
        const result = await withAuth((token) =>
          receiveConsignmentItem(token, consignmentId, code),
        );
        if (result.outcome === 'RECEIVED') {
          notifySuccess(`Received ${result.trackingCode} (${result.arrived} of ${result.total})`);
          void hapticSuccess();
        } else if (result.outcome === 'ALREADY_RECEIVED') {
          notifyError(
            'Already received',
            `${result.trackingCode} was already received at ${formatDate(result.arrivedAt)}${
              result.arrivedByName ? ` by ${result.arrivedByName}` : ''
            }`,
          );
          void hapticWarning();
        } else if (result.outcome === 'NOT_DISPATCHED') {
          notifyError(
            'Not dispatched yet',
            `${result.trackingCode} hasn't been dispatched yet — it's still at ${
              result.sourceBranchName ?? 'the sending branch'
            } and hasn't been loaded onto a consignment.`,
          );
          void hapticWarning();
        } else {
          notifyError(
            'Wrong consignment',
            `${result.trackingCode} belongs to ${result.belongsToConsignmentCode ?? 'another consignment'}, not this one.`,
          );
          void hapticWarning();
        }
        await load();
      } catch (err) {
        notifyError(
          'Receive failed',
          err instanceof Error ? err.message : 'Unable to receive parcel',
        );
        void hapticError();
      } finally {
        setScanBusy(false);
      }
    },
    [canReceive, consignmentId, isOpen, load, withAuth],
  );

  const handleCloseConsignment = useCallback(async () => {
    if (!consignmentId) return;
    setCloseBusy(true);
    try {
      const result = await withAuth((token) => closeConsignment(token, consignmentId));
      notifySuccess(
        result.status === CONSIGNMENT_STATUS.CLOSED
          ? 'Consignment closed — all parcels received'
          : 'Consignment closed',
      );
      void hapticSuccess();
      router.back();
    } catch (err) {
      const missingParcelIds =
        err instanceof ApiRequestError
          ? (err.details?.missingParcelIds as string[] | undefined)
          : undefined;
      if (missingParcelIds) {
        setMissingCount(missingParcelIds.length);
        setReasonModalOpen(true);
        return;
      }
      notifyError(
        'Close failed',
        err instanceof Error ? err.message : 'Unable to close consignment',
      );
      void hapticError();
    } finally {
      setCloseBusy(false);
    }
  }, [consignmentId, router, withAuth]);

  const handleConfirmCloseWithExceptions = useCallback(async () => {
    if (!consignmentId) return;
    const reason = exceptionReason.trim();
    if (!reason) {
      notifyError('Reason required', 'Enter a reason before closing with missing parcels.');
      void hapticWarning();
      return;
    }
    setCloseBusy(true);
    try {
      const result = await withAuth((token) =>
        closeConsignment(token, consignmentId, {
          forceWithExceptions: true,
          exceptionReason: reason,
        }),
      );
      notifySuccess(
        `Consignment closed with ${result.missingParcelIds.length} missing parcel(s) flagged as discrepancies`,
      );
      void hapticSuccess();
      setReasonModalOpen(false);
      setExceptionReason('');
      router.back();
    } catch (err) {
      notifyError(
        'Close failed',
        err instanceof Error ? err.message : 'Unable to close consignment',
      );
      void hapticError();
    } finally {
      setCloseBusy(false);
    }
  }, [consignmentId, exceptionReason, router, withAuth]);

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to receive consignments." />
      </AppScreen>
    );
  }

  const arrived = consignment?.arrived ?? 0;
  const total = consignment?.total ?? 0;

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Receive {consignment?.code ?? ''}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
            Scan each parcel to receive it against this consignment.
          </Text>
        </View>
        <View style={styles.tallyBox}>
          <Text style={[styles.tallyNumber, { color: theme.colors.secondary }]}>
            {arrived}/{total}
          </Text>
          <Text style={[styles.tallyLabel, { color: theme.colors.textSubtle }]}>arrived</Text>
        </View>
      </View>

      {isOpen && canReceive ? (
        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Scanner</Text>
          <ScannerView onCodeScanned={receiveByCode} />
          {scanBusy ? (
            <Text style={[styles.helperText, { color: theme.colors.textSubtle }]}>
              Processing scan...
            </Text>
          ) : null}

          <AppLabel>Or type tracking / booking code</AppLabel>
          <AppInput
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="Tracking or booking code"
            autoCapitalize="characters"
          />
          <AppButton
            title="Receive"
            onPress={() => {
              const code = manualCode.trim();
              if (!code) return;
              setManualCode('');
              void receiveByCode(code);
            }}
            disabled={scanBusy || manualCode.trim().length === 0}
          />
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Checklist</Text>
        {loading ? (
          <Text style={[styles.helperText, { color: theme.colors.textSubtle }]}>Loading...</Text>
        ) : items.length === 0 ? (
          <Text style={[styles.helperText, { color: theme.colors.textSubtle }]}>
            No parcels in this consignment.
          </Text>
        ) : (
          <View style={styles.checklist}>
            {items.map((item) => (
              <View
                key={item.parcelId}
                style={[styles.checklistRow, { borderTopColor: theme.colors.separator }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemCode, { color: theme.colors.text }]}>
                    {item.trackingCode}
                  </Text>
                  <Text style={[styles.itemMeta, { color: theme.colors.textSubtle }]}>
                    {item.receiverName}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.itemStatus,
                    { color: item.arrivedAt ? theme.colors.success : theme.colors.textMuted },
                  ]}
                >
                  {item.arrivedAt ? 'Arrived' : 'Pending'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </AppCard>

      {isOpen ? (
        <View
          style={[
            styles.stickyFooter,
            mobileShadow.floating,
            {
              backgroundColor: theme.colors.bgElevated,
              borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
              borderWidth: theme.scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
            },
          ]}
        >
          <AppButton
            title="Back"
            onPress={() => {
              router.back();
              void hapticTap();
            }}
            variant="secondary"
          />
          <AppButton
            title={closeBusy ? 'Closing...' : 'Close Consignment'}
            onPress={() => void handleCloseConsignment()}
            disabled={closeBusy}
          />
        </View>
      ) : null}

      <Modal
        visible={reasonModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReasonModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Close with missing parcels?
            </Text>
            <Text style={[styles.helperText, { color: theme.colors.textSubtle }]}>
              {missingCount} parcel{missingCount === 1 ? '' : 's'} not yet arrived. Closing now will
              flag {missingCount === 1 ? 'it' : 'them'} as a discrepancy. A reason is required.
            </Text>
            <AppLabel>Reason</AppLabel>
            <AppInput
              value={exceptionReason}
              onChangeText={setExceptionReason}
              placeholder="e.g. Truck left before remaining boxes were unloaded"
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setReasonModalOpen(false);
                  setExceptionReason('');
                }}
                disabled={closeBusy}
              />
              <AppButton
                title={closeBusy ? 'Closing...' : 'Close with exceptions'}
                onPress={() => void handleConfirmCloseWithExceptions()}
                disabled={closeBusy}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.sm },
  title: { ...mobileTextStyles.title1 },
  subtitle: { ...mobileTextStyles.subhead, marginTop: -2 },
  tallyBox: { alignItems: 'flex-end' },
  tallyNumber: { ...mobileTextStyles.title2, fontWeight: '800' },
  tallyLabel: { ...mobileTextStyles.caption1 },
  sectionTitle: { ...mobileTextStyles.headline },
  helperText: { ...mobileTextStyles.subhead },
  checklist: { marginTop: -mobileSpacing.xs },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  itemCode: { ...mobileTextStyles.subhead, fontWeight: '700' },
  itemMeta: { ...mobileTextStyles.caption1 },
  itemStatus: { ...mobileTextStyles.caption1, fontWeight: '700' },
  stickyFooter: {
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.sm + 2,
    gap: mobileSpacing.sm,
    flexDirection: 'row',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: mobileSpacing.lg,
  },
  modalCard: {
    width: '100%',
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.md,
    gap: mobileSpacing.sm,
  },
  modalActions: { flexDirection: 'row', gap: mobileSpacing.sm, marginTop: mobileSpacing.sm },
});
