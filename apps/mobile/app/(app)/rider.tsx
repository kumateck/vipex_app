import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { PaymentBreakdownCard, StatCard } from '@mobile/components/courier';
import { AppButton, AppCard, AppInput, MobileNoAccess } from '@mobile/components/ui';
import {
  formatCedisFromPsw,
  shiftDateKey,
  todayDateKey,
  useRiderBoardData,
} from '@mobile/features/rider/hooks/use-rider-board-data';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export default function RiderScreen() {
  const { theme } = useAppearance();
  const [selectedDate, setSelectedDate] = useState(todayDateKey());
  const {
    canView,
    refreshing,
    load,
    assignedForDay,
    completedForDay,
    returnedForDay,
    totalAmountReceivedPsw,
    totalDeliveryFeePsw,
    totalToBePaidPsw,
  } = useRiderBoardData(selectedDate);

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access rider operations." />
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={() => void load()}>
      <Text style={[styles.summaryText, { color: theme.colors.textSubtle }]}>
        Summary for {selectedDate}
      </Text>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Date</Text>
        <AppInput
          value={selectedDate}
          onChangeText={(value) => setSelectedDate(value.trim())}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.row}>
          <AppButton
            title="Previous"
            variant="secondary"
            onPress={() => setSelectedDate((prev) => shiftDateKey(prev, -1))}
          />
          <AppButton
            title="Today"
            variant="secondary"
            onPress={() => setSelectedDate(todayDateKey())}
          />
          <AppButton
            title="Next"
            variant="secondary"
            onPress={() => setSelectedDate((prev) => shiftDateKey(prev, 1))}
          />
        </View>
      </AppCard>

      <View style={styles.grid}>
        <View style={styles.kpiRow}>
          <StatCard label="Total Assigned" value={assignedForDay.length} />
          <StatCard label="Total Completed" value={completedForDay.length} />
        </View>
        <View style={styles.kpiRow}>
          <StatCard label="Total Returned" value={returnedForDay.length} />
          <StatCard label="Total Amount" value={formatCedisFromPsw(totalAmountReceivedPsw)} />
        </View>
      </View>

      <PaymentBreakdownCard
        deliveryFeePsw={totalDeliveryFeePsw}
        transitFeePsw={totalToBePaidPsw}
        senderPaidTransit={false}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...mobileTextStyles.headline },
  summaryText: { ...mobileTextStyles.subhead, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: mobileSpacing.sm },
  grid: { gap: mobileSpacing.sm },
  kpiRow: { flexDirection: 'row', gap: mobileSpacing.sm },
});
