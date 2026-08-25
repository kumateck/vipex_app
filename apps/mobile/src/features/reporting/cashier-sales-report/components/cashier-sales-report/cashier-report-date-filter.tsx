import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { CashierReportCalendarDialog } from '../../dialogs';
import { formatReportDate } from '../../utils';

type Props = {
  date: string;
  loading: boolean;
  hasPendingDate: boolean;
  onChangeDate: (date: string) => void;
  onLoad: () => void;
};

export function CashierReportDateFilter(props: Props) {
  const { theme } = useAppearance();
  const [calendarOpen, setCalendarOpen] = useState(false);
  return (
    <>
      <AppCard>
        <Text style={[styles.label, { color: theme.colors.textSubtle }]}>SESSION OPEN DATE</Text>
        <View style={styles.filterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select session open date"
            onPress={() => setCalendarOpen(true)}
            style={[styles.dateButton, { backgroundColor: theme.colors.cardMuted }]}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.dateText, { color: theme.colors.text }]}>
              {formatReportDate(props.date)}
            </Text>
            <Ionicons name="chevron-down" size={18} color={theme.colors.textSubtle} />
          </Pressable>
          <View style={styles.loadButton}>
            <AppButton
              title="Load"
              onPress={props.onLoad}
              loading={props.loading}
              disabled={!props.hasPendingDate}
            />
          </View>
        </View>
        {props.hasPendingDate ? (
          <Text style={[styles.changed, { color: theme.colors.warning }]}>
            Date changed. Load the report to view its results.
          </Text>
        ) : null}
      </AppCard>
      <CashierReportCalendarDialog
        key={props.date}
        visible={calendarOpen}
        selectedDate={props.date}
        onSelect={props.onChangeDate}
        onClose={() => setCalendarOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  label: { ...mobileTextStyles.eyebrow },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  dateButton: {
    flex: 3.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm,
    minHeight: 50,
    paddingHorizontal: mobileSpacing.md,
    borderRadius: mobileRadius.md,
  },
  dateText: { ...mobileTextStyles.body, flex: 1, fontWeight: '600' },
  loadButton: { flex: 1 },
  changed: { ...mobileTextStyles.caption1 },
});
