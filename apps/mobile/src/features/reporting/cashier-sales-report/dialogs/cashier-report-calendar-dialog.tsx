import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import {
  buildCalendarDays,
  formatMonth,
  monthKeyFromDate,
  moveMonthKey,
  toDateKey,
} from '../utils';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Props = {
  visible: boolean;
  selectedDate: string;
  onClose: () => void;
  onSelect: (date: string) => void;
};

export function CashierReportCalendarDialog(props: Props) {
  const { theme } = useAppearance();
  const [month, setMonth] = useState(() => monthKeyFromDate(props.selectedDate));
  const days = buildCalendarDays(month);
  const canGoNextMonth = month < monthKeyFromDate(toDateKey());

  const select = (date: string) => {
    props.onSelect(date);
    props.onClose();
  };

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} />
        <View
          style={[styles.card, mobileShadow.modal, { backgroundColor: theme.colors.bgElevated }]}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => setMonth((current) => moveMonthKey(current, -1))}
              style={[styles.monthButton, { backgroundColor: theme.colors.cardMuted }]}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.month, { color: theme.colors.text }]}>{formatMonth(month)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              disabled={!canGoNextMonth}
              onPress={() => setMonth((current) => moveMonthKey(current, 1))}
              style={[
                styles.monthButton,
                { backgroundColor: theme.colors.cardMuted, opacity: canGoNextMonth ? 1 : 0.35 },
              ]}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((day, index) => (
              <Text
                key={`${day}-${index}`}
                style={[styles.weekday, { color: theme.colors.textSubtle }]}
              >
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {days.map((day) => {
              const selected = day.key === props.selectedDate;
              return (
                <Pressable
                  key={day.key}
                  disabled={day.future}
                  accessibilityRole="button"
                  accessibilityLabel={day.key}
                  onPress={() => select(day.key)}
                  style={[styles.day, selected && { backgroundColor: theme.colors.primary }]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: selected
                          ? theme.colors.primaryText
                          : day.inMonth && !day.future
                            ? theme.colors.text
                            : theme.colors.textSubtle,
                        opacity: day.future ? 0.35 : 1,
                      },
                    ]}
                  >
                    {day.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton title="Cancel" variant="secondary" onPress={props.onClose} />
            </View>
            <View style={styles.action}>
              <AppButton title="Today" onPress={() => select(toDateKey())} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: mobileSpacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    borderRadius: mobileRadius.xl,
    padding: mobileSpacing.lg,
    gap: mobileSpacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { ...mobileTextStyles.headline },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: mobileRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row' },
  weekday: {
    width: '14.285%',
    textAlign: 'center',
    ...mobileTextStyles.caption1,
    fontWeight: '700',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  day: {
    width: '14.285%',
    height: 42,
    borderRadius: mobileRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { ...mobileTextStyles.subhead, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: mobileSpacing.sm },
  action: { flex: 1 },
});
