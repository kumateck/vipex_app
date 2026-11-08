import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppCard } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { CompletedPickup } from '../../hooks';
import { pickupStyles } from './office-pickup.styles';

/** Shown after the parcel is marked Delivered by Office. */
export const PickupSuccessCard = memo(function PickupSuccessCard({
  completed,
  onDone,
}: {
  completed: CompletedPickup;
  onDone: () => void;
}) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
        <Text style={[pickupStyles.title, { color: theme.colors.text }]}>Parcel delivered</Text>
        <Text style={[pickupStyles.text, styles.centerText, { color: theme.colors.textMuted }]}>
          {completed.parcel.trackingCode} is now Delivered by Office. Collected by:{' '}
          {completed.collectedBy.toLowerCase()}.
        </Text>
      </View>
      <AppButton title="Deliver another parcel" onPress={onDone} />
    </AppCard>
  );
});

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 8 },
  centerText: { textAlign: 'center' },
});
