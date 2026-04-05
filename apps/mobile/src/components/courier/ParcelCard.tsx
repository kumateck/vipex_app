import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppStatusChip } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileTypography } from '@mobile/theme/layout';

type ParcelCardData = {
  bookingCode: string;
  parcelDetails: string;
  senderName?: string | null;
  senderPhone?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  status: string | number;
  isDeleted?: boolean;
};

type ParcelCardProps = {
  parcel: ParcelCardData;
  onPress?: () => void;
  actionLabel?: string;
};

export function ParcelCard({ parcel, onPress, actionLabel = 'Open Parcel' }: ParcelCardProps) {
  const { theme } = useAppearance();

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Booking: {parcel.bookingCode}
      </Text>
      <Text style={{ color: theme.colors.textMuted }}>
        Sender: {parcel.senderName ?? '-'} ({parcel.senderPhone ?? '-'})
      </Text>
      <Text style={{ color: theme.colors.textMuted }}>
        Receiver: {parcel.receiverName ?? '-'} ({parcel.receiverPhone ?? '-'})
      </Text>
      <Text style={{ color: theme.colors.textMuted }}>{parcel.parcelDetails}</Text>
      <AppStatusChip label={parcel.status} />
      {parcel.isDeleted ? (
        <Text style={[styles.deleted, { color: theme.colors.danger }]}>Deleted Record</Text>
      ) : null}
      {onPress ? <AppButton title={actionLabel} onPress={onPress} variant="secondary" /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  deleted: { fontWeight: '700' },
});
