import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { hapticTap } from '@mobile/lib/haptics';
import {
  AppButton,
  AppCard,
  AppInput,
  AppLabel,
  AppStatusChip,
  MobileNoAccess,
} from '@/components/ui/mobile';
import { mobileShadow } from '@mobile/theme/layout';
import { useReceiveProcess } from '../../hooks';
import { formatCedis, formatDate, limitPhoneDigits, PHONE_DIGITS } from '../../utils';
import { DetailRow } from './receive-process-detail-row';
import { styles } from './receive-process.styles';

export function ReceiveProcessScreen() {
  const { theme } = useAppearance();
  const {
    canView,
    canEdit,
    router,
    busy,
    parcel,
    details,
    initialLoading,
    saveBusy,
    arriveBusy,
    editParcelDetails,
    setEditParcelDetails,
    editParcelContent,
    setEditParcelContent,
    editReceiverName,
    setEditReceiverName,
    editReceiverPhone,
    setEditReceiverPhone,
    saveIncomingEdits,
    markArrived,
  } = useReceiveProcess();
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
