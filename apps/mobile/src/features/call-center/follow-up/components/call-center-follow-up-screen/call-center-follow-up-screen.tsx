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
import { useCallCenterFollowUp } from '../../hooks';
import { AddressCollectionForm } from './address-collection-form';

export function CallCenterFollowUpScreen() {
  const { session } = useAuth();
  const { theme } = useAppearance();
  const permissions = session.user?.permissions ?? [];
  const canRead = canViewCallCenterFollowUp(permissions);
  const canRecordCall = canRecordCallCenterContact(permissions);
  const canCollect = canCollectDoorstepAddress(permissions);
  const workflow = useCallCenterFollowUp(canRead, canRecordCall, canCollect);

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
        subtitle="Call receivers and capture confirmed doorstep addresses and fees."
      />
      {workflow.selected ? (
        <AddressCollectionForm
          parcel={workflow.selected}
          saving={workflow.saving}
          canCollect={canCollect}
          onBack={() => workflow.setSelected(null)}
          onCall={() => void workflow.callReceiver(workflow.selected!)}
          onSave={workflow.saveAddress}
        />
      ) : (
        <>
          <View style={styles.searchRow}>
            <View style={styles.searchInput}>
              <AppInput
                value={workflow.search}
                onChangeText={workflow.setSearch}
                placeholder="Booking, tracking or receiver"
              />
            </View>
            <AppButton title="Search" loading={workflow.loading} onPress={workflow.submitSearch} />
          </View>
          {workflow.loading ? (
            <AppSkeletonCard />
          ) : workflow.parcels.length ? (
            workflow.parcels.map((parcel) => (
              <Pressable key={parcel.id} onPress={() => workflow.setSelected(parcel)}>
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
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.sm },
  searchInput: { flex: 1 },
  title: { ...mobileTextStyles.headline },
  text: { ...mobileTextStyles.subhead },
});
