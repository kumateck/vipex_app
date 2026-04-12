import { StyleSheet, Text } from 'react-native';
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
  const routeText =
    [parcel.senderName ?? '-', parcel.receiverName ?? '-'].filter(Boolean).join(' → ') || '-';

  return (
    <AppCard>
      <Text style={[styles.bookingCode, { color: theme.colors.text }]}>{parcel.bookingCode}</Text>
      <Text style={[styles.route, { color: theme.colors.textMuted }]}>{routeText}</Text>
      <Text style={[styles.body, { color: theme.colors.textMuted }]}>
        Sender: {parcel.senderName ?? '-'} ({parcel.senderPhone ?? '-'})
      </Text>
      <Text style={[styles.body, { color: theme.colors.textMuted }]}>
        Receiver: {parcel.receiverName ?? '-'} ({parcel.receiverPhone ?? '-'})
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSubtle }]}>{parcel.parcelDetails}</Text>
      <AppStatusChip label={parcel.status} />
      {parcel.isDeleted ? (
        <Text style={[styles.deleted, { color: theme.colors.danger }]}>Deleted Record</Text>
      ) : null}
      {onPress ? <AppButton title={actionLabel} onPress={onPress} variant="secondary" /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  bookingCode: { fontSize: mobileTypography.sectionTitle, fontWeight: '800' },
  route: { fontSize: mobileTypography.body, fontWeight: '600' },
  body: { fontSize: mobileTypography.body, lineHeight: 19 },
  deleted: { fontWeight: '700' },
});
