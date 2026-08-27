import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import {
  AppButton,
  AppCard,
  AppInput,
  AppLabel,
  AppPageHeader,
  AppSkeletonCard,
  MobileNoAccess,
} from '@mobile/components/ui/mobile';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canReviewDeliveryChanges } from '@mobile/lib/permissions';
import { mobileTextStyles } from '@mobile/theme/layout';
import { useDeliveryChangeReview } from '../../hooks';

const money = (psw: number | null) => `GHS ${((psw ?? 0) / 100).toFixed(2)}`;

export function DeliveryChangeReviewScreen() {
  const { session } = useAuth();
  const { theme } = useAppearance();
  const canReview = canReviewDeliveryChanges(session.user?.permissions ?? []);
  const workflow = useDeliveryChangeReview(canReview);
  const [note, setNote] = useState('');

  if (!canReview)
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to review delivery address and fee changes." />
      </AppScreen>
    );

  const close = () => {
    workflow.setSelected(null);
    setNote('');
  };

  return (
    <AppScreen>
      <AppPageHeader
        title="Delivery Change Reviews"
        subtitle="Approve or reject rider-requested address and delivery-fee changes for your branch."
        rightSlot={
          <AppButton title="Refresh" variant="plain" onPress={() => void workflow.load()} />
        }
      />
      {workflow.selected ? (
        <>
          <AppCard>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {workflow.selected.bookingCode}
            </Text>
            <Text style={[styles.text, { color: theme.colors.textMuted }]}>
              Rider: {workflow.selected.riderName ?? '-'}
            </Text>
            <AppLabel>Current</AppLabel>
            <Text style={[styles.text, { color: theme.colors.text }]}>
              {workflow.selected.currentDropoffAddress ?? 'No address'} ·{' '}
              {money(workflow.selected.currentChargePsw)}
            </Text>
            <AppLabel>Requested</AppLabel>
            <Text style={[styles.text, { color: theme.colors.text }]}>
              {workflow.selected.requestedDropoffAddress ?? 'No address'} ·{' '}
              {money(workflow.selected.requestedChargePsw)}
            </Text>
            <AppLabel>Rider reason</AppLabel>
            <Text style={[styles.text, { color: theme.colors.textMuted }]}>
              {workflow.selected.reason ?? '-'}
            </Text>
            <AppLabel>Review note (optional)</AppLabel>
            <AppInput value={note} onChangeText={setNote} multiline maxLength={500} />
            <AppButton
              title="Approve change"
              loading={workflow.saving}
              onPress={() => void workflow.decide('APPROVED', note)}
            />
            <AppButton
              title="Reject change"
              variant="secondary"
              disabled={workflow.saving}
              onPress={() => void workflow.decide('REJECTED', note)}
            />
          </AppCard>
          <AppButton title="Back to requests" variant="plain" onPress={close} />
        </>
      ) : workflow.loading ? (
        <AppSkeletonCard />
      ) : workflow.requests.length ? (
        workflow.requests.map((request) => (
          <Pressable key={request.deliveryId} onPress={() => workflow.setSelected(request)}>
            <AppCard>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {request.bookingCode}
              </Text>
              <Text style={[styles.text, { color: theme.colors.textMuted }]}>
                Rider: {request.riderName ?? '-'}
              </Text>
              <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
                {request.currentDropoffAddress ?? 'No current address'} →{' '}
                {request.requestedDropoffAddress ?? 'No requested address'}
              </Text>
              <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
                {money(request.currentChargePsw)} → {money(request.requestedChargePsw)}
              </Text>
            </AppCard>
          </Pressable>
        ))
      ) : (
        <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
          No delivery changes are awaiting review.
        </Text>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.headline },
  text: { ...mobileTextStyles.subhead },
});
