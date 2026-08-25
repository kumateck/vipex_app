import { memo, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { formatCedisFromPsw } from '@mobile/features/rider/hooks/use-rider-board-data';
import type { RiderDoorstepRecord } from '@mobile/types/parcels';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { ActiveDeliveryAction } from '../../types';
import { getOutstandingDeliveryFeePsw, getOutstandingPrincipalPsw } from '../../utils';

function InfoRow(props: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  const { theme } = useAppearance();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: theme.colors.cardMuted }]}>
        <Ionicons name={props.icon} size={17} color={theme.colors.textMuted} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={[styles.infoLabel, { color: theme.colors.textSubtle }]}>{props.label}</Text>
        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{props.value}</Text>
      </View>
    </View>
  );
}

type Props = {
  delivery: RiderDoorstepRecord;
  canComplete: boolean;
  hasPendingChange: boolean;
  activeAction: ActiveDeliveryAction;
  onConfirm: (parcelId: string) => void;
  onRequestChange: (delivery: RiderDoorstepRecord) => void;
  onReturn: (parcelId: string) => void;
};

export const AssignedDeliveryDetails = memo(function AssignedDeliveryDetails(props: Props) {
  const { theme } = useAppearance();
  const isBusy = props.activeAction?.parcelId === props.delivery.parcelId;
  return (
    <AppCard>
      <View style={styles.heading}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Delivery details</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
            Confirm before handover
          </Text>
        </View>
        <Ionicons name="receipt-outline" size={22} color={theme.colors.primary} />
      </View>

      <View style={styles.infoList}>
        <InfoRow icon="cube-outline" label="Parcel" value={props.delivery.parcelDetails || '-'} />
        <InfoRow
          icon="call-outline"
          label="Receiver phone"
          value={props.delivery.receiverPhone ?? '-'}
        />
        <InfoRow
          icon="location-outline"
          label="Drop-off address"
          value={props.delivery.dropoffAddress ?? '-'}
        />
      </View>

      <View style={[styles.breakdown, { backgroundColor: theme.colors.cardMuted }]}>
        <View style={styles.moneyRow}>
          <Text style={[styles.moneyLabel, { color: theme.colors.textMuted }]}>To-be-paid</Text>
          <Text style={[styles.moneyValue, { color: theme.colors.text }]}>
            {formatCedisFromPsw(getOutstandingPrincipalPsw(props.delivery))}
          </Text>
        </View>
        <View style={styles.moneyRow}>
          <Text style={[styles.moneyLabel, { color: theme.colors.textMuted }]}>Delivery fee</Text>
          <Text style={[styles.moneyValue, { color: theme.colors.text }]}>
            {formatCedisFromPsw(getOutstandingDeliveryFeePsw(props.delivery))}
          </Text>
        </View>
      </View>

      {props.canComplete ? (
        <View style={styles.actions}>
          {props.hasPendingChange ? (
            <View style={[styles.pendingNote, { backgroundColor: `${theme.colors.primary}12` }]}>
              <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.pendingText, { color: theme.colors.textMuted }]}>
                Address and fee change awaiting review. Delivery confirmation is locked.
              </Text>
            </View>
          ) : null}
          <AppButton
            title="Confirm delivery"
            loading={isBusy && props.activeAction?.type === 'delivered'}
            disabled={isBusy || props.hasPendingChange}
            onPress={() => props.onConfirm(props.delivery.parcelId)}
          />
          <AppButton
            title="Request address/fee change"
            variant="secondary"
            disabled={isBusy || props.hasPendingChange}
            onPress={() => props.onRequestChange(props.delivery)}
          />
          <AppButton
            title="Return to office"
            variant="secondary"
            loading={isBusy && props.activeAction?.type === 'returned'}
            disabled={isBusy}
            onPress={() => props.onReturn(props.delivery.parcelId)}
          />
        </View>
      ) : (
        <Text style={[styles.permissionNote, { color: theme.colors.textSubtle }]}>
          You can view this delivery, but your role cannot complete or return it.
        </Text>
      )}
    </AppCard>
  );
});

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...mobileTextStyles.headline },
  subtitle: { ...mobileTextStyles.caption1, marginTop: 2 },
  infoList: { gap: mobileSpacing.md, marginTop: mobileSpacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.sm },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: { flex: 1, minWidth: 0 },
  infoLabel: { ...mobileTextStyles.caption1 },
  infoValue: { ...mobileTextStyles.subhead, fontWeight: '600', marginTop: 1 },
  breakdown: { borderRadius: mobileRadius.md, padding: mobileSpacing.md, gap: mobileSpacing.sm },
  moneyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: mobileSpacing.sm },
  moneyLabel: { ...mobileTextStyles.subhead },
  moneyValue: { ...mobileTextStyles.subhead, fontWeight: '700' },
  actions: { gap: mobileSpacing.sm },
  pendingNote: {
    flexDirection: 'row',
    gap: mobileSpacing.xs,
    borderRadius: mobileRadius.md,
    padding: mobileSpacing.sm,
  },
  pendingText: { ...mobileTextStyles.caption1, flex: 1 },
  permissionNote: { ...mobileTextStyles.footnote, textAlign: 'center' },
});
