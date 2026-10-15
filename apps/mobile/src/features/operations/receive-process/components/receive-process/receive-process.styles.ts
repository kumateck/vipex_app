import { StyleSheet } from 'react-native';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title1 },
  subtitle: { ...mobileTextStyles.subhead, marginTop: -2, marginBottom: mobileSpacing.xs },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  sectionTitle: { ...mobileTextStyles.headline },
  detailList: { marginTop: -mobileSpacing.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
  },
  detailLabel: { ...mobileTextStyles.subhead, flexShrink: 0 },
  detailValue: { ...mobileTextStyles.subhead, fontWeight: '600', flex: 1, textAlign: 'right' },
  empty: { ...mobileTextStyles.subhead, textAlign: 'center', marginTop: mobileSpacing.lg + 2 },
  loadingRow: {
    marginTop: mobileSpacing.sm - 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm,
  },
  loadingText: {
    ...mobileTextStyles.footnote,
  },
  skeletonLineLong: {
    height: 14,
    borderRadius: mobileRadius.sm,
    width: '100%',
  },
  skeletonLineMedium: {
    height: 14,
    borderRadius: mobileRadius.sm,
    width: '70%',
  },
  stickyFooter: {
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.sm + 2,
    gap: mobileSpacing.sm,
  },
});
