import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { AppButton, AppCard, AppInput, AppLabel } from '@/components/ui/mobile';
import { isTenDigitPhone } from './use-customer-lookup';
import type { UseCustomerLookupResult } from './use-customer-lookup';

type CustomerLookupCardProps = {
  title: string;
  lookup: UseCustomerLookupResult;
};

export function CustomerLookupCard({ title, lookup }: CustomerLookupCardProps) {
  const { theme } = useAppearance();
  const canLookup = isTenDigitPhone(lookup.telephone);

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>

      <AppLabel>Telephone</AppLabel>
      <View style={styles.row}>
        <View style={styles.rowInput}>
          <AppInput
            value={lookup.telephone}
            onChangeText={lookup.setTelephone}
            placeholder="0240000000"
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
        <AppButton
          title={lookup.isLookingUp ? 'Searching...' : 'Find'}
          onPress={() => void lookup.lookup()}
          disabled={!canLookup || lookup.isLookingUp}
          variant="secondary"
        />
      </View>

      {lookup.hasLookedUp && lookup.matches.length > 0 ? (
        <View style={styles.matches}>
          <AppLabel>Matching customers</AppLabel>
          {lookup.matches.map((match) => {
            const selected = match.id === lookup.customerId;
            return (
              <Pressable
                key={match.id}
                onPress={() => lookup.selectMatch(match)}
                style={[
                  styles.matchOption,
                  {
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: selected ? `${theme.colors.primary}14` : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.matchName, { color: theme.colors.text }]}>
                  {match.fullname}
                </Text>
                <Text style={[styles.matchPhone, { color: theme.colors.textSubtle }]}>
                  {match.telephone}
                  {match.telephone2 ? ` / ${match.telephone2}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {lookup.hasLookedUp && lookup.matches.length === 0 ? (
        <Text style={[styles.helper, { color: theme.colors.textSubtle }]}>
          No match found. A new customer will be created.
        </Text>
      ) : null}

      {lookup.hasLookedUp ? (
        <>
          <AppLabel>Full name</AppLabel>
          <AppInput
            value={lookup.fullname}
            onChangeText={lookup.setFullname}
            editable={!lookup.isExistingCustomer}
            placeholder="Enter full name"
          />

          <AppLabel>Telephone 2 (optional)</AppLabel>
          <AppInput
            value={lookup.telephone2}
            onChangeText={lookup.setTelephone2}
            editable={!lookup.isExistingCustomer}
            placeholder="0240000001"
            keyboardType="number-pad"
            maxLength={10}
          />
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.headline },
  row: { flexDirection: 'row', gap: mobileSpacing.sm, alignItems: 'flex-start' },
  rowInput: { flex: 1 },
  matches: { gap: mobileSpacing.xs },
  matchOption: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm,
    gap: 2,
  },
  matchName: { ...mobileTextStyles.body, fontWeight: '600' },
  matchPhone: { ...mobileTextStyles.footnote },
  helper: { ...mobileTextStyles.footnote },
});
