import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from '@mobile/navigation/router-compat';
import { AppScreen } from '@mobile/components/screen';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import {
  getParcelDetails,
  searchParcels,
  updateCustomer,
  updateParcel,
  updateParcelStatus,
} from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canMarkParcelArrived, canViewReceiveScreen } from '@mobile/lib/permissions';
import { hapticError, hapticSuccess, hapticTap, hapticWarning } from '@mobile/lib/haptics';
import {
  AppButton,
  AppCard,
  AppInput,
  AppLabel,
  AppStatusChip,
  MobileNoAccess,
} from '@/components/ui/mobile';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

function DetailRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  const { theme } = useAppearance();
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
      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function formatCedis(psw: number | null | undefined) {
  return `GH₵ ${((psw ?? 0) / 100).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

const PHONE_DIGITS = 10;
const normalizePhoneDigits = (value: string) => value.replace(/\D/g, '');
const limitPhoneDigits = (value: string) => normalizePhoneDigits(value).slice(0, PHONE_DIGITS);

export default function ReceiveProcessParcelScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canView = canViewReceiveScreen(permissions);
  const canEdit = canMarkParcelArrived(permissions);
  const router = useRouter();
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
  const companyId = session.user?.company?.id ?? session.user?.companyId;

  const [busy, setBusy] = useState(false);
  const [parcel, setParcel] = useState<ParcelSearchRow | null>(null);
  const [details, setDetails] = useState<ParcelFullDetails | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [arriveBusy, setArriveBusy] = useState(false);
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
          search: detailsPayload.parcel.bookingCode,
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
      void hapticError();
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
    const receiverPhoneValue = normalizePhoneDigits(editReceiverPhone);

    if (!parcelDetailsValue) {
      Alert.alert('Validation', 'Parcel details is required.');
      void hapticWarning();
      return;
    }
    if (!receiverNameValue) {
      Alert.alert('Validation', 'Receiver name is required.');
      void hapticWarning();
      return;
    }
    if (receiverPhoneValue.length > 0 && receiverPhoneValue.length !== PHONE_DIGITS) {
      Alert.alert('Validation', `Receiver telephone must be exactly ${PHONE_DIGITS} digits.`);
      void hapticWarning();
      return;
    }
    if (!canEdit) {
      notifyError('Permission denied', 'You do not have permission to edit incoming fields.');
      void hapticWarning();
      return;
    }

    try {
      setSaveBusy(true);
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
      void hapticSuccess();
      await loadParcel();
    } catch (err) {
      notifyError('Save failed', err instanceof Error ? err.message : 'Unable to save changes');
      void hapticError();
    } finally {
      setSaveBusy(false);
    }
  }

  async function markArrived() {
    if (!parcelId || !parcel) return;
    if (!canEdit) {
      notifyError('Permission denied', 'You do not have permission to confirm parcel arrival.');
      void hapticWarning();
      return;
    }
    try {
      setArriveBusy(true);
      await withAuth((token) =>
        updateParcelStatus(token, parcelId, ParcelStatus.ARRIVED_AT_DESTINATION),
      );
      notifySuccess(`Parcel ${parcel.bookingCode} marked ARRIVED_AT_DESTINATION.`);
      void hapticSuccess();
      router.replace('/(app)/receive');
    } catch (err) {
      notifyError(
        'Mark arrived failed',
        err instanceof Error ? err.message : 'Unable to update parcel status',
      );
      void hapticError();
    } finally {
      setArriveBusy(false);
    }
  }

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to process incoming parcels." />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <Text style={[styles.title, { color: theme.colors.text }]}>Process Incoming Parcel</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Review parcel information, correct incoming data, then confirm arrival.
      </Text>
      {initialLoading ? (
        <AppCard>
          <View style={[styles.skeletonLineLong, { backgroundColor: theme.colors.cardMuted }]} />
          <View style={[styles.skeletonLineMedium, { backgroundColor: theme.colors.cardMuted }]} />
          <View style={[styles.skeletonLineLong, { backgroundColor: theme.colors.cardMuted }]} />
          <View style={[styles.skeletonLineLong, { backgroundColor: theme.colors.cardMuted }]} />
          <View style={[styles.skeletonLineMedium, { backgroundColor: theme.colors.cardMuted }]} />
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={[styles.loadingText, { color: theme.colors.textSubtle }]}>
              Loading parcel details...
            </Text>
          </View>
        </AppCard>
      ) : null}
      {!initialLoading && !parcel ? (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>Parcel not found.</Text>
      ) : null}
      {parcel ? (
        <AppCard>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Parcel Overview</Text>
            <AppStatusChip label={parcel.status} />
          </View>
          <View style={styles.detailList}>
            <DetailRow first label="Booking" value={parcel.bookingCode} />
            <DetailRow
              label="Sender"
              value={`${parcel.senderName ?? '-'} (${parcel.senderPhone ?? '-'})`}
            />
            <DetailRow
              label="Receiver"
              value={`${parcel.receiverName ?? '-'} (${parcel.receiverPhone ?? '-'})`}
            />
            <DetailRow label="Charge" value={formatCedis(parcel.chargePsw)} />
            <DetailRow label="To Be Paid" value={formatCedis(parcel.plannedToBePaidPsw)} />
            <DetailRow label="Pickup Queue" value={parcel.pickupQueueCode ?? '-'} />
            {details?.pickupQueue?.queuedAt ? (
              <DetailRow label="Queued At" value={formatDate(details.pickupQueue.queuedAt)} />
            ) : null}
            {details?.delivery ? (
              <DetailRow
                label="Delivery"
                value={`${details.delivery.status} | ${details.delivery.dropoffAddress ?? '-'}`}
              />
            ) : null}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Edit Incoming Fields
          </Text>
          <AppLabel>Parcel Details</AppLabel>
          <AppInput
            value={editParcelDetails}
            onChangeText={setEditParcelDetails}
            placeholder="Parcel details"
          />
          <AppLabel>Parcel Content</AppLabel>
          <AppInput
            value={editParcelContent}
            onChangeText={setEditParcelContent}
            placeholder="Parcel content"
          />
          <AppLabel>Receiver Fullname</AppLabel>
          <AppInput
            value={editReceiverName}
            onChangeText={setEditReceiverName}
            placeholder="Receiver fullname"
          />
          <AppLabel>Receiver Telephone</AppLabel>
          <AppInput
            value={editReceiverPhone}
            onChangeText={(value) => setEditReceiverPhone(limitPhoneDigits(value))}
            placeholder="Receiver telephone"
            keyboardType="number-pad"
            maxLength={PHONE_DIGITS}
          />
          {!canEdit ? (
            <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
              You have view-only access. Editing and arrival confirmation are disabled.
            </Text>
          ) : null}
        </AppCard>
      ) : null}

      {parcel ? (
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
            title="Back To Incoming List"
            onPress={() => {
              router.push('/(app)/receive');
              void hapticTap();
            }}
            variant="secondary"
          />
          <AppButton
            title={saveBusy ? 'Saving...' : 'Save Incoming Edits'}
            onPress={() => void saveIncomingEdits()}
            disabled={busy || saveBusy || arriveBusy || !canEdit}
          />
          <AppButton
            title={arriveBusy ? 'Updating...' : 'Confirm Arrived'}
            onPress={() => void markArrived()}
            disabled={busy || saveBusy || arriveBusy || !canEdit}
            variant="secondary"
          />
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title1 },
  subtitle: { ...mobileTextStyles.subhead, marginTop: -2, marginBottom: mobileSpacing.xs },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  sectionTitle: { ...mobileTextStyles.headline },
  detailList: { marginTop: -mobileSpacing.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
  },
  detailLabel: { ...mobileTextStyles.subhead, flexShrink: 0 },
  detailValue: { ...mobileTextStyles.subhead, fontWeight: '600', flex: 1, textAlign: 'right' },
  empty: { ...mobileTextStyles.subhead, textAlign: 'center', marginTop: mobileSpacing.lg + 2 },
  loadingRow: {
    marginTop: mobileSpacing.sm - 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm,
  },
  loadingText: {
    ...mobileTextStyles.footnote,
  },
  skeletonLineLong: {
    height: 14,
    borderRadius: mobileRadius.sm,
    width: '100%',
  },
  skeletonLineMedium: {
    height: 14,
    borderRadius: mobileRadius.sm,
    width: '70%',
  },
  stickyFooter: {
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.sm + 2,
    gap: mobileSpacing.sm,
  },
});
