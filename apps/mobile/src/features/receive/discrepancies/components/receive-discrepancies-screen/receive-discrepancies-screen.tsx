import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import {
  AppButton,
  AppCard,
  AppInput,
  AppLabel,
  AppPageHeader,
  AppSelectField,
  AppSkeletonCard,
  MobileNoAccess,
} from '@mobile/components/ui/mobile';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canViewIncomingConsignments } from '@mobile/lib/permissions';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import { useReceiveDiscrepancies } from '../../hooks';
import type { DiscrepancyPhoto, DiscrepancyType } from '../../types';
import { DiscrepancyPhotoCapture } from '../discrepancy-photo-capture';

const TYPE_OPTIONS = [
  { value: 'record_not_physical', label: 'System record, parcel missing' },
  { value: 'physical_missing_in_system', label: 'Physical parcel, no system record' },
];

export function ReceiveDiscrepanciesScreen() {
  const { session } = useAuth();
  const { theme } = useAppearance();
  const canRead = canViewIncomingConsignments(session.user?.permissions ?? []);
  const workflow = useReceiveDiscrepancies(canRead);
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState<DiscrepancyType>('record_not_physical');
  const [search, setSearch] = useState('');
  const [parcel, setParcel] = useState<ParcelSearchRow | null>(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<DiscrepancyPhoto | null>(null);
  const validIdentity =
    type === 'record_not_physical'
      ? Boolean(parcel)
      : Boolean(trackingCode.trim() || bookingCode.trim());
  const valid = validIdentity && notes.trim().length > 0 && Boolean(photo);

  if (!canRead)
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to record receiving discrepancies." />
      </AppScreen>
    );

  const reset = () => {
    setCreating(false);
    setParcel(null);
    setSearch('');
    setTrackingCode('');
    setBookingCode('');
    setNotes('');
    setPhoto(null);
  };

  const submit = async () => {
    if (!photo) return;
    if (
      await workflow.submit({
        discrepancyType: type,
        parcel,
        trackingCode,
        bookingCode,
        notes,
        photo,
      })
    )
      reset();
  };

  return (
    <AppScreen>
      <AppPageHeader
        title="Receiving Discrepancies"
        subtitle="Record missing or unmatched parcels with mandatory photo evidence."
        rightSlot={
          <AppButton
            title={creating ? 'Cancel' : 'Log new'}
            variant="plain"
            onPress={() => (creating ? reset() : setCreating(true))}
          />
        }
      />
      {workflow.pendingEvidence ? (
        <AppCard>
          <Text style={[styles.title, { color: theme.colors.warning }]}>
            Photo evidence pending
          </Text>
          <Text style={[styles.text, { color: theme.colors.textMuted }]}>
            The discrepancy was saved. Retry the photo upload without logging another discrepancy.
          </Text>
          <AppButton
            title="Retry photo upload"
            loading={workflow.saving}
            onPress={() => void workflow.retryEvidence()}
          />
        </AppCard>
      ) : null}
      {creating ? (
        <>
          <AppCard>
            <AppSelectField
              label="Discrepancy type"
              value={type}
              options={TYPE_OPTIONS}
              onValueChange={(value) => {
                setType(value as DiscrepancyType);
                setParcel(null);
              }}
            />
            {type === 'record_not_physical' ? (
              <>
                <AppLabel>Find expected parcel</AppLabel>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <AppInput
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Tracking or booking code"
                    />
                  </View>
                  <AppButton
                    title="Find"
                    variant="secondary"
                    onPress={() => void workflow.searchParcels(search)}
                  />
                </View>
                {workflow.matches.map((match) => (
                  <Pressable
                    key={match.id}
                    onPress={() => setParcel(match)}
                    style={[
                      styles.match,
                      {
                        borderColor:
                          parcel?.id === match.id ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                      {match.bookingCode}
                    </Text>
                    <Text style={[styles.text, { color: theme.colors.textMuted }]}>
                      {match.trackingCode} · {match.parcelDetails}
                    </Text>
                  </Pressable>
                ))}
              </>
            ) : (
              <>
                <AppLabel>Tracking code (if visible)</AppLabel>
                <AppInput value={trackingCode} onChangeText={setTrackingCode} />
                <AppLabel>Booking code (if visible)</AppLabel>
                <AppInput value={bookingCode} onChangeText={setBookingCode} />
              </>
            )}
            <AppLabel>Receiving notes</AppLabel>
            <AppInput
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={1000}
              placeholder="Describe what was expected or physically found."
            />
          </AppCard>
          <DiscrepancyPhotoCapture value={photo} onChange={setPhoto} />
          <AppButton
            title="Log discrepancy"
            loading={workflow.saving}
            disabled={!valid}
            onPress={() => void submit()}
          />
        </>
      ) : workflow.loading ? (
        <AppSkeletonCard />
      ) : workflow.openItems.length ? (
        workflow.openItems.map((item) => (
          <AppCard key={item.id}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {item.bookingCode ?? item.trackingCode ?? 'Unmatched parcel'}
            </Text>
            <Text style={[styles.text, { color: theme.colors.textMuted }]}>
              {item.discrepancyType.replaceAll('_', ' ')}
            </Text>
            <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
              {item.notes ?? 'No notes'}
            </Text>
          </AppCard>
        ))
      ) : (
        <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
          No open discrepancies for this branch.
        </Text>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.sm },
  flex: { flex: 1 },
  match: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: mobileSpacing.sm },
  title: { ...mobileTextStyles.headline },
  text: { ...mobileTextStyles.subhead },
});
