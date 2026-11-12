import { pickupOfficeLabel } from '@/shared/shipments/receiving-office';
import { ParcelHandoverNoteAction } from '@mobile/features/operations/parcel-handover-note';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScannerView } from '@mobile/components/courier/ScannerView';
import { AppButton, AppCard, AppInput, AppSkeletonCard } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { OfficePickupList } from '../../hooks';
import type { PickupParcel } from '../../types';
import { getPickupQueueBadgeNumber } from '../../utils';
import { pickupStyles } from './office-pickup.styles';

type Props = { list: OfficePickupList; onOpen: (parcel: PickupParcel) => void };

function ParcelRow({
  parcel,
  showQueueNumber,
  onOpen,
}: {
  parcel: PickupParcel;
  showQueueNumber: boolean;
  onOpen: () => void;
}) {
  const { theme } = useAppearance();
  const pickup = pickupOfficeLabel(parcel.pickupLocationName, parcel.receivingOfficeName);
  const queueNumber = getPickupQueueBadgeNumber(showQueueNumber, parcel);
  return (
    <AppCard>
      <Pressable onPress={onOpen} accessibilityRole="button" style={{ gap: 4 }}>
        <View style={pickupStyles.row}>
          <Text style={[pickupStyles.title, pickupStyles.flex, { color: theme.colors.text }]}>
            {parcel.trackingCode}
          </Text>
          {queueNumber != null ? (
            <Text style={[pickupStyles.hint, { color: theme.colors.primary }]}>
              Queue #{queueNumber}
            </Text>
          ) : null}
        </View>
        <Text style={[pickupStyles.text, { color: theme.colors.textMuted }]}>
          Receiver: {parcel.receiverName ?? '-'} · {parcel.receiverPhone ?? '-'}
        </Text>
        <Text style={[pickupStyles.text, { color: theme.colors.textMuted }]}>
          Sender: {parcel.senderName ?? '-'} · {parcel.senderPhone ?? '-'}
        </Text>
        <Text style={[pickupStyles.hint, { color: theme.colors.textSubtle }]} numberOfLines={1}>
          {parcel.bookingCode} · {parcel.parcelDetails}
        </Text>
        {pickup ? (
          <Text style={[pickupStyles.text, { color: theme.colors.textMuted }]}>{pickup}</Text>
        ) : null}
      </Pressable>
      <ParcelHandoverNoteAction
        parcelId={parcel.id}
        hasHandoverNote={parcel.hasHandoverNote}
        handoverNoteCritical={parcel.handoverNoteCritical}
      />
    </AppCard>
  );
}

/** Search or scan for a sender-paid parcel that is ready for office pickup. */
export function PickupParcelFinder({ list, onOpen }: Props) {
  const { theme } = useAppearance();
  const [scanning, setScanning] = useState(false);
  const muted = { color: theme.colors.textSubtle };

  return (
    <>
      <AppCard>
        <AppInput
          value={list.search}
          onChangeText={list.setSearch}
          onSubmitEditing={() => list.submitSearch()}
          returnKeyType="search"
          autoCapitalize="none"
          placeholder="Booking code, tracking code, name or phone"
          accessibilityLabel="Search by booking code, tracking code, or sender or receiver name or phone"
        />
        <Text style={[pickupStyles.hint, muted]}>
          Enter the sender or receiver name or phone number, or scan the QR code on the sticker.
        </Text>
        <View style={pickupStyles.row}>
          <View style={pickupStyles.flex}>
            <AppButton
              title={list.loading ? 'Searching…' : 'Search'}
              loading={list.loading}
              onPress={() => list.submitSearch()}
            />
          </View>
          <AppButton
            title={scanning ? 'Close scanner' : 'Scan sticker'}
            variant="secondary"
            onPress={() => setScanning((open) => !open)}
          />
        </View>
      </AppCard>
      {scanning ? (
        <ScannerView
          processing={list.loading}
          onCodeScanned={(code) => {
            setScanning(false);
            list.searchByScan(code);
          }}
        />
      ) : null}
      {list.loading ? (
        <AppSkeletonCard />
      ) : list.rows.length ? (
        list.rows.map((parcel) => (
          <ParcelRow
            key={parcel.id}
            parcel={parcel}
            showQueueNumber={list.isPickupQueueEnabled}
            onOpen={() => onOpen(parcel)}
          />
        ))
      ) : (
        <Text style={[pickupStyles.text, muted]}>
          {list.searched
            ? 'No sender-paid parcel awaiting pickup matched. Parcels with a balance to collect go through the receiver cashier.'
            : list.isPickupQueueEnabled
              ? 'No queued parcels are waiting for pickup.'
              : 'Search or scan a parcel to start a pickup.'}
        </Text>
      )}
    </>
  );
}
