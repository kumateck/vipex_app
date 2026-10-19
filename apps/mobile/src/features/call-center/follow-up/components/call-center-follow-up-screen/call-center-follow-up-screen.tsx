import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import {
  AppButton,
  AppCard,
  AppInput,
  AppPageHeader,
  AppSkeletonCard,
  MobileNoAccess,
} from '@mobile/components/ui/mobile';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import {
  canCollectDoorstepAddress,
  canRecordCallCenterContact,
  canViewCallCenterFollowUp,
} from '@mobile/lib/permissions';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { CallOutcomeDialog } from '../../dialogs';
import { useAssignedCallOutcomes, useCallCenterFollowUp } from '../../hooks';
import type { CallCenterQueueMode } from '../../types';
import { AddressCollectionForm } from './address-collection-form';
import { AssignedCallList } from './assigned-call-list';
import { CallCenterQueueSwitch } from './call-center-queue-switch';

export function CallCenterFollowUpScreen() {
  const { session } = useAuth();
  const { theme } = useAppearance();
  const permissions = session.user?.permissions ?? [];
  const canRead = canViewCallCenterFollowUp(permissions);
  const canRecordCall = canRecordCallCenterContact(permissions);
  const canCollect = canCollectDoorstepAddress(permissions);
  const [mode, setMode] = useState<CallCenterQueueMode>(canRecordCall ? 'assigned' : 'addresses');
  const assigned = useAssignedCallOutcomes(canRecordCall && mode === 'assigned');
  const addresses = useCallCenterFollowUp(
    canCollect,
    canRecordCall,
    canCollect,
    mode === 'addresses',
  );

  if (!canRead)
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access call-center parcel follow-up." />
      </AppScreen>
    );

  return (
    <AppScreen>
      <AppPageHeader
        title="Call Center Follow-up"
        subtitle="Work parcels assigned to you and record the receiver's confirmed outcome."
      />
      <CallCenterQueueSwitch
        value={mode}
        showAssigned={canRecordCall}
        showAddresses={canCollect}
        onChange={(value) => {
          addresses.setSelected(null);
          assigned.closeOutcome();
          setMode(value);
        }}
      />
      {mode === 'assigned' ? (
        <AssignedCallList
          search={assigned.search}
          loading={assigned.loading}
          saving={assigned.saving}
          parcels={assigned.parcels}
          onSearchChange={assigned.setSearch}
          onSearch={assigned.submitSearch}
          onOpenOutcome={assigned.openOutcome}
          onMarkCalled={(parcel) => void assigned.markCalled(parcel)}
          onCallPhone={assigned.callPhone}
        />
      ) : addresses.selected ? (
        <AddressCollectionForm
          parcel={addresses.selected}
          saving={addresses.saving}
          canCollect={canCollect}
          onBack={() => addresses.setSelected(null)}
          onCall={() => void addresses.callReceiver(addresses.selected!)}
          onSave={addresses.saveAddress}
        />
      ) : (
        <>
          <View style={styles.searchRow}>
            <View style={styles.searchInput}>
              <AppInput
                value={addresses.search}
                onChangeText={addresses.setSearch}
                placeholder="Booking, tracking or receiver"
              />
            </View>
            <AppButton
              title="Search"
              loading={addresses.loading}
              onPress={addresses.submitSearch}
            />
          </View>
          {addresses.loading ? (
            <AppSkeletonCard />
          ) : addresses.parcels.length ? (
            addresses.parcels.map((parcel) => (
              <Pressable key={parcel.id} onPress={() => addresses.setSelected(parcel)}>
                <AppCard>
                  <Text style={[styles.title, { color: theme.colors.text }]}>
                    {parcel.bookingCode}
                  </Text>
                  <Text style={[styles.text, { color: theme.colors.textMuted }]}>
                    {parcel.receiverName ?? '-'} · {parcel.receiverPhone ?? '-'}
                  </Text>
                  <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
                    {parcel.parcelDetails}
                  </Text>
                </AppCard>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
              No home-delivery requests need address follow-up.
            </Text>
          )}
        </>
      )}
      <CallOutcomeDialog
        parcel={assigned.selected}
        outcome={assigned.outcome}
        useSecondReceiver={assigned.useSecondReceiver}
        secondReceiverName={assigned.secondReceiverName}
        secondReceiverPhone={assigned.secondReceiverPhone}
        sendSms={assigned.sendSms}
        sendEmail={assigned.sendEmail}
        saving={assigned.saving}
        onOutcomeChange={assigned.setOutcome}
        onUseSecondReceiverChange={assigned.setUseSecondReceiver}
        onSecondReceiverNameChange={assigned.setSecondReceiverName}
        onSecondReceiverPhoneChange={assigned.setSecondReceiverPhone}
        onSendSmsChange={assigned.setSendSms}
        onSendEmailChange={assigned.setSendEmail}
        onCall={() => void assigned.callReceiver()}
        onClose={assigned.closeOutcome}
        onSave={() => void assigned.saveOutcome()}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.sm },
  searchInput: { flex: 1 },
  title: { ...mobileTextStyles.headline },
  text: { ...mobileTextStyles.subhead },
});
