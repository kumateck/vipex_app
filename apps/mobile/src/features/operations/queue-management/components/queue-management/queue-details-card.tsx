import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppStatusChip } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { formatCedis, formatQueueDate } from '../../utils/queue-management-utils';
import { QueueDetailRow } from './queue-detail-row';

type QueueDetailsCardProps = {
  parcel: ParcelSearchRow;
  details: ParcelFullDetails | null;
  canIssueQueue: boolean;
  canIssueTicket: boolean;
  issuing: boolean;
  onIssue: () => void;
  onClose: () => void;
};

export function QueueDetailsCard(props: QueueDetailsCardProps) {
  const { theme } = useAppearance();
  const recentPayments = (props.details?.payments ?? []).slice(0, 3);
  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Parcel details</Text>
      <View style={styles.list}>
        <QueueDetailRow label="Booking" value={props.parcel.bookingCode} first />
        <QueueDetailRow
          label="Sender"
          value={`${props.parcel.senderName ?? '-'} (${props.parcel.senderPhone ?? '-'})`}
        />
        <QueueDetailRow
          label="Receiver"
          value={`${props.parcel.receiverName ?? '-'} (${props.parcel.receiverPhone ?? '-'})`}
        />
        <QueueDetailRow label="Details" value={props.parcel.parcelDetails} />
        <QueueDetailRow label="Content" value={props.parcel.parcelContent ?? '-'} />
        <QueueDetailRow label="Charge" value={formatCedis(props.parcel.chargePsw)} />
        <QueueDetailRow label="To be paid" value={formatCedis(props.parcel.plannedToBePaidPsw)} />
        <QueueDetailRow label="Status" value={<AppStatusChip label={props.parcel.status} />} />
        <QueueDetailRow
          label="Queue"
          value={
            props.details?.pickupQueue?.queueCode ?? props.parcel.pickupQueueCode ?? 'Not queued'
          }
        />
        {props.details?.pickupQueue?.queuedAt ? (
          <QueueDetailRow
            label="Queued at"
            value={formatQueueDate(props.details.pickupQueue.queuedAt)}
          />
        ) : null}
        {props.details?.delivery ? (
          <>
            <QueueDetailRow label="Delivery status" value={props.details.delivery.status} />
            <QueueDetailRow label="Dropoff" value={props.details.delivery.dropoffAddress ?? '-'} />
            <QueueDetailRow
              label="Delivery fee"
              value={formatCedis(props.details.delivery.chargePsw)}
            />
            <QueueDetailRow
              label="Delivery paid"
              value={formatCedis(props.details.delivery.amountPaidPsw)}
            />
          </>
        ) : null}
        <QueueDetailRow label="Payments" value={props.details?.payments?.length ?? 0} />
      </View>
      {recentPayments.length ? (
        <View style={styles.payments}>
          {recentPayments.map((payment) => (
            <Text key={payment.id} style={[styles.payment, { color: theme.colors.textSubtle }]}>
              {formatQueueDate(payment.receivedAt)} · {formatCedis(payment.grossAmountPsw)}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.actions}>
        <View style={styles.primaryAction}>
          <AppButton
            title={props.issuing ? 'Issuing…' : 'Issue queue ticket'}
            disabled={!props.canIssueQueue || props.issuing || !props.canIssueTicket}
            onPress={props.onIssue}
          />
        </View>
        <AppButton title="Close" onPress={props.onClose} variant="secondary" />
      </View>
      {!props.canIssueQueue ? (
        <Text style={[styles.note, { color: theme.colors.textSubtle }]}>
          A ticket can only be issued when this parcel has no queue code for today.
        </Text>
      ) : null}
      {!props.canIssueTicket ? (
        <Text style={[styles.note, { color: theme.colors.textSubtle }]}>
          You do not have permission to issue queue tickets.
        </Text>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.headline },
  list: { marginTop: -mobileSpacing.xs },
  payments: { gap: 2 },
  payment: { ...mobileTextStyles.footnote },
  actions: { flexDirection: 'row', gap: mobileSpacing.sm },
  primaryAction: { flex: 1 },
  note: { ...mobileTextStyles.caption1 },
});
