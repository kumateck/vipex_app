import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export type DetailEntry =
  | [label: string, value: string | number | null | undefined]
  | null
  | undefined
  | false;

/** A titled card of label/value rows; empty values render as "-" and null entries are skipped. */
export function ParcelDetailCard({
  title,
  rows,
  children,
}: {
  title: string;
  rows?: DetailEntry[];
  children?: ReactNode;
}) {
  const { theme } = useAppearance();
  const visible = (rows ?? []).filter((row): row is [string, string | number | null | undefined] =>
    Boolean(row),
  );
  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {visible.length ? (
        <View style={styles.list}>
          {visible.map(([label, value], index) => (
            <View
              key={label}
              style={[
                styles.row,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: theme.colors.separator,
                },
              ]}
            >
              <Text style={[styles.label, { color: theme.colors.textSubtle }]}>{label}</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {value == null || value === '' ? '-' : String(value)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {children}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title3 },
  list: { marginTop: -mobileSpacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
  },
  label: { ...mobileTextStyles.subhead, flexShrink: 0, maxWidth: '45%' },
  value: { ...mobileTextStyles.subhead, fontWeight: '600', flex: 1, textAlign: 'right' },
});
