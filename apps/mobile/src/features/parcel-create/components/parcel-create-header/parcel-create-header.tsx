import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { PaymentResponsibility } from '@mobile/constants/payment';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { MobilePaymentResponsibility } from '../../mobile-parcel-payment-plan';

export function ParcelCreateHeader({
  paymentResponsibility,
}: {
  paymentResponsibility: MobilePaymentResponsibility;
}) {
  const { theme } = useAppearance();
  const navigation = useNavigation();
  const title =
    paymentResponsibility === PaymentResponsibility.SENDER
      ? 'Create Paid Parcel'
      : 'Create TobePaid Parcel';

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open side menu"
        hitSlop={8}
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={({ pressed }) => [styles.menuButton, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="menu-outline" size={26} color={theme.colors.text} />
      </Pressable>
      <View style={styles.titleGroup}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
          {paymentResponsibility === PaymentResponsibility.RECIPIENT
            ? 'Choose whether to queue the parcel or complete it and print a sticker here.'
            : 'Create the booking here, then complete sender payment at the cashier.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
  },
  menuButton: { paddingVertical: 3, paddingRight: mobileSpacing.xs },
  titleGroup: { flex: 1, gap: 4 },
  title: { ...mobileTextStyles.largeTitle },
  subtitle: { ...mobileTextStyles.subhead },
});
