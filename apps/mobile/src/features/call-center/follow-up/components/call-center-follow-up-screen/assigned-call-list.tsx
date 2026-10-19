import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput, AppSkeletonCard } from '@mobile/components/ui';
import { getParcelStatusLabel } from '@mobile/constants/parcel-status';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import { formatPsw, formatReceivedAt } from '../../utils';
import { ParcelStatus } from '@mobile/constants/parcel-status';

type Props = {
  search: string;
  loading: boolean;
  saving: boolean;
  parcels: ParcelSearchRow[];
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onOpenOutcome: (parcel: ParcelSearchRow) => void;
  onMarkCalled: (parcel: ParcelSearchRow) => void;
  onCallPhone: (phone: string | null | undefined) => void;
};

export function AssignedCallList(props: Props) {
  const { theme } = useAppearance();
  return (
    <>
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <AppInput
            value={props.search}
            onChangeText={props.onSearchChange}
            placeholder="Booking, tracking, receiver or phone"
            returnKeyType="search"
            onSubmitEditing={props.onSearch}
          />
        </View>
        <AppButton title="Search" loading={props.loading} onPress={props.onSearch} />
      </View>
      {props.loading ? (
        <>
          <AppSkeletonCard lines={5} />
          <AppSkeletonCard lines={5} />
        </>
      ) : props.parcels.length ? (
        props.parcels.map((parcel) => (
          <AppCard key={parcel.id}>
            <View style={styles.topRow}>
              <View style={styles.identity}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {parcel.bookingCode}
                </Text>
                <Text style={[styles.caption, { color: theme.colors.textSubtle }]}>
                  Received {formatReceivedAt(parcel.receivedAt)}
                </Text>
              </View>
              <ContactState contacted={Boolean(parcel.callCenterCalledAt)} />
            </View>
            <View style={styles.details}>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                {parcel.receiverName ?? '-'}
              </Text>
              <Text style={[styles.text, { color: theme.colors.textMuted }]}>
                {[parcel.receiverPhone, parcel.receiverPhone2].filter(Boolean).join(', ') || '-'}
              </Text>
              <Text style={[styles.text, { color: theme.colors.textMuted }]}>
                {parcel.parcelDetails || '-'} · {parcel.parcelContent || '-'}
              </Text>
              <Text style={[styles.caption, { color: theme.colors.textSubtle }]}>
                {parcel.sourceLocationName ?? parcel.sourceName ?? '-'} →{' '}
                {parcel.pickupLocationName ?? parcel.destinationName ?? '-'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={[styles.caption, { color: theme.colors.textSubtle }]}>
                {getParcelStatusLabel(parcel.status)}
              </Text>
              <Text style={[styles.payment, { color: theme.colors.text }]}>
                Receiver pays: {formatPsw(parcel.plannedToBePaidPsw)}
              </Text>
            </View>
            <View style={styles.callRow}>
              <View style={styles.callAction}>
                <AppButton
                  title="Call receiver"
                  variant="secondary"
                  disabled={!parcel.receiverPhone || props.saving}
                  onPress={() => props.onCallPhone(parcel.receiverPhone)}
                />
              </View>
              <View style={styles.callAction}>
                <AppButton
                  title="Call sender"
                  variant="secondary"
                  disabled={!parcel.senderPhone || props.saving}
                  onPress={() => props.onCallPhone(parcel.senderPhone)}
                />
              </View>
            </View>
            {(
              [
                ParcelStatus.ARRIVED_AT_DESTINATION,
                ParcelStatus.CUSTOMER_CONTACTED,
                ParcelStatus.RETURNED_TO_OFFICE,
                ParcelStatus.AWAITING_PICKUP,
                ParcelStatus.HOME_DELIVERY_REQUESTED,
              ] as number[]
            ).includes(parcel.status) ? (
              <AppButton
                title="Change outcome and record call"
                disabled={props.saving}
                onPress={() => props.onOpenOutcome(parcel)}
              />
            ) : null}
            <AppButton
              title="Mark as called"
              variant="secondary"
              disabled={props.saving}
              onPress={() => props.onMarkCalled(parcel)}
            />
          </AppCard>
        ))
      ) : (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          No parcels are currently assigned to you for calling.
        </Text>
      )}
    </>
  );
}

function ContactState({ contacted }: { contacted: boolean }) {
  const { theme } = useAppearance();
  const tone = contacted ? theme.colors.success : theme.colors.warning;
  return (
    <View style={[styles.contactChip, { backgroundColor: `${tone}1F` }]}>
      <Text style={[styles.contactText, { color: tone }]}>
        {contacted ? 'Contacted' : 'Not Contacted'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.sm },
  searchInput: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.sm },
  identity: { flex: 1 },
  title: { ...mobileTextStyles.headline },
  caption: { ...mobileTextStyles.caption1 },
  text: { ...mobileTextStyles.subhead },
  details: { gap: 2 },
  metaRow: { gap: mobileSpacing.xs },
  callRow: { flexDirection: 'row', gap: mobileSpacing.sm },
  callAction: { flex: 1 },
  payment: { ...mobileTextStyles.footnote, fontWeight: '700' },
  contactChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  contactText: { ...mobileTextStyles.caption1, fontWeight: '700' },
  empty: { ...mobileTextStyles.subhead, textAlign: 'center', paddingVertical: mobileSpacing.xxl },
});
