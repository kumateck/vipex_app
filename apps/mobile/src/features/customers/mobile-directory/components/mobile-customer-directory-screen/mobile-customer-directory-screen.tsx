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
import { canUpdateCustomers, canViewCustomers } from '@mobile/lib/permissions';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { useMobileCustomerDirectory } from '../../hooks';
import { MobileCustomerEditForm } from './mobile-customer-edit-form';

export function MobileCustomerDirectoryScreen() {
  const { session } = useAuth();
  const { theme } = useAppearance();
  const permissions = session.user?.permissions ?? [];
  const canRead = canViewCustomers(permissions);
  const canUpdate = canUpdateCustomers(permissions);
  const directory = useMobileCustomerDirectory(canRead, canUpdate);

  if (!canRead)
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to view customers." />
      </AppScreen>
    );

  return (
    <AppScreen>
      <AppPageHeader
        title="Customers"
        subtitle="Search company customers and update limited contact details when permitted."
      />
      {directory.selected ? (
        <MobileCustomerEditForm
          customer={directory.selected}
          canUpdate={canUpdate}
          saving={directory.saving}
          onBack={() => directory.setSelected(null)}
          onSave={directory.save}
        />
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.flex}>
              <AppInput
                value={directory.search}
                onChangeText={directory.setSearch}
                placeholder="Name, phone or email"
              />
            </View>
            <AppButton
              title="Search"
              loading={directory.loading}
              onPress={directory.submitSearch}
            />
          </View>
          {directory.loading ? (
            <AppSkeletonCard />
          ) : directory.customers.length ? (
            directory.customers.map((customer) => (
              <Pressable key={customer.id} onPress={() => directory.setSelected(customer)}>
                <AppCard>
                  <Text style={[styles.title, { color: theme.colors.text }]}>
                    {customer.fullname}
                  </Text>
                  <Text style={[styles.text, { color: theme.colors.textMuted }]}>
                    {customer.telephone ?? '-'}
                    {customer.telephone2 ? ` · ${customer.telephone2}` : ''}
                  </Text>
                  {customer.email ? (
                    <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
                      {customer.email}
                    </Text>
                  ) : null}
                </AppCard>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
              No customers matched this search.
            </Text>
          )}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.sm },
  flex: { flex: 1 },
  title: { ...mobileTextStyles.headline },
  text: { ...mobileTextStyles.subhead },
});
