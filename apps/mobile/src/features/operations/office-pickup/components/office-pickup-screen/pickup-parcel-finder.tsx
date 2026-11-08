import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScannerView } from '@mobile/components/courier/ScannerView';
import { AppButton, AppCard, AppInput, AppSkeletonCard } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { OfficePickupList } from '../../hooks';
import type { PickupParcel } from '../../types';
import { pickupStyles } from './office-pickup.styles';

type Props = { list: OfficePickupList; onOpen: (parcel: PickupParcel) => void };

function ParcelRow({ parcel, onOpen }: { parcel: PickupParcel; onOpen: () => void }) {
  const { theme } = useAppearance();
  return (
    <Pressable onPress={onOpen} accessibilityRole="button">
      <AppCard>
        <View style={pickupStyles.row}>
          <Text style={[pickupStyles.title, pickupStyles.flex, { color: theme.colors.text }]}>
            {parcel.trackingCode}
          </Text>
          {parcel.pickupQueueNumber != null ? (
            <Text style={[pickupStyles.hint, { color: theme.colors.primary }]}>
              Queue #{parcel.pickupQueueNumber}
            </Text>
          ) : null}
        </View>
        <Text style={[pickupStyles.text, { color: theme.colors.textMuted }]}>
          {parcel.receiverName ?? '-'} · {parcel.receiverPhone ?? '-'}
        </Text>
        <Text style={[pickupStyles.hint, { color: theme.colors.textSubtle }]} numberOfLines={1}>
          {parcel.bookingCode} · {parcel.parcelDetails}
        </Text>
      </AppCard>
    </Pressable>
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
          placeholder="Tracking, booking, telephone or receiver name"
        />
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
          <ParcelRow key={parcel.id} parcel={parcel} onOpen={() => onOpen(parcel)} />
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
