import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppCard } from '@mobile/components/ui/mobile';
import { ParcelHandoverNoteAction } from '@mobile/features/operations/parcel-handover-note';
import { PickupOfficeText } from '@mobile/features/operations/parcel-receiving-office';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { BatchPickupParcel } from '@/shared/shipments/parcel-batch-handover';
import { formatBatchAmount } from '@/features/operations/parcel-batch-handover/utils';

export const MobileBatchParcelRow = memo(function MobileBatchParcelRow({
  row,
  checked,
  disabled,
  toggle,
}: {
  row: BatchPickupParcel;
  checked: boolean;
  disabled: boolean;
  toggle: (parcel: BatchPickupParcel) => void;
}) {
  const { theme } = useAppearance();
  const blocked = disabled || Boolean(row.blockedReason);
  return (
    <AppCard>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled: blocked }}
        disabled={blocked}
        onPress={() => toggle(row)}
        style={{ flexDirection: 'row', gap: 10 }}
      >
        <Ionicons
          name={checked ? 'checkbox-outline' : 'square-outline'}
          size={23}
          color={checked ? theme.colors.primary : theme.colors.textMuted}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
            {row.trackingCode} · {row.receiverName}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {row.bookingCode} · {row.parcelDetails}
          </Text>
          <PickupOfficeText
            location={row.pickupLocationName}
            office={row.receivingOfficeName}
            style={{ color: theme.colors.textMuted }}
          />
          {row.queueNumber != null ? (
            <Text style={{ color: theme.colors.textMuted }}>Queue #{row.queueNumber}</Text>
          ) : null}
          {row.principalPsw + row.storagePsw > 0 ? (
            <Text style={{ color: theme.colors.text }}>
              {formatBatchAmount(row.principalPsw + row.storagePsw)} due
            </Text>
          ) : null}
          {row.blockedReason ? (
            <Text style={{ color: theme.colors.danger }}>{row.blockedReason}</Text>
          ) : null}
        </View>
      </Pressable>
      <ParcelHandoverNoteAction
        parcelId={row.id}
        hasHandoverNote={row.hasHandoverNote}
        handoverNoteCritical={row.handoverNoteCritical}
      />
    </AppCard>
  );
});
