import { StyleSheet } from 'react-native';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export const pickupStyles = StyleSheet.create({
  title: { ...mobileTextStyles.headline },
  text: { ...mobileTextStyles.subhead },
  hint: { ...mobileTextStyles.caption1 },
  strong: { fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  flex: { flex: 1 },
  section: { gap: mobileSpacing.sm },
  notice: {
    borderWidth: 1,
    borderRadius: mobileRadius.md,
    padding: mobileSpacing.md,
    gap: mobileSpacing.xs,
  },
});
