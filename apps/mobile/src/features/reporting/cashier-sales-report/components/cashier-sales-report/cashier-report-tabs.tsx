import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CashierSalesReportTab } from '../../types';

type Props = {
  tab: CashierSalesReportTab;
  paymentCount: number;
  toBePaidCount: number;
  onChange: (tab: CashierSalesReportTab) => void;
};

export function CashierReportTabs(props: Props) {
  const { theme } = useAppearance();
  const tabs: Array<{ key: CashierSalesReportTab; label: string; count: number }> = [
    { key: 'payments', label: 'Payments', count: props.paymentCount },
    { key: 'tobepaid', label: 'To Be Paid', count: props.toBePaidCount },
  ];
  return (
    <View style={[styles.tabs, { backgroundColor: theme.colors.cardMuted }]}>
      {tabs.map((item) => {
        const active = props.tab === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => props.onChange(item.key)}
            style={[styles.tab, active && { backgroundColor: theme.colors.card }]}
          >
            <Text
              style={[styles.label, { color: active ? theme.colors.text : theme.colors.textMuted }]}
            >
              {item.label}
            </Text>
            <View
              style={[
                styles.count,
                { backgroundColor: active ? `${theme.colors.primary}18` : theme.colors.bg },
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  { color: active ? theme.colors.primary : theme.colors.textSubtle },
                ]}
              >
                {item.count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', padding: 4, borderRadius: mobileRadius.md, gap: 4 },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: mobileRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: mobileSpacing.xs,
  },
  label: { ...mobileTextStyles.subhead, fontWeight: '700' },
  count: {
    minWidth: 23,
    height: 23,
    paddingHorizontal: 5,
    borderRadius: mobileRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { ...mobileTextStyles.caption2, fontWeight: '800' },
});
