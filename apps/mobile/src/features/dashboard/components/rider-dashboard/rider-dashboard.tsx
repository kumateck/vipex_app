import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AppScreen } from '@mobile/components/screen';
import { AppPageHeader, MobileNoAccess } from '@mobile/components/ui';
import { mobileSpacing } from '@mobile/theme/layout';
import { useDashboardMotion, useRiderDashboard } from '../../hooks';
import { formatDashboardDate } from '../../utils';
import { DashboardMenuButton } from '../dashboard-screen';
import { RiderActivityCard } from './rider-activity-card';
import { RiderAmountHero } from './rider-amount-hero';
import { RiderDashboardError, RiderDashboardLoading } from './rider-dashboard-state';
import { RiderPaymentBreakdown } from './rider-payment-breakdown';
import { RiderQuickActions } from './rider-quick-actions';

export function RiderDashboard() {
  const dashboard = useRiderDashboard();
  const motion = useDashboardMotion();

  if (!dashboard.canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="Your rider role does not include access to delivery analytics." />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      style={styles.screen}
      refreshing={dashboard.refreshing}
      onRefresh={dashboard.refresh}
    >
      <Animated.View style={motion.headerStyle}>
        <AppPageHeader
          title="Rider Dashboard"
          subtitle={`Today · ${formatDashboardDate()}`}
          rightSlot={<DashboardMenuButton />}
        />
      </Animated.View>

      {dashboard.error ? (
        <RiderDashboardError message={dashboard.error} onRetry={dashboard.refresh} />
      ) : null}
      {dashboard.loading ? (
        <RiderDashboardLoading />
      ) : (
        <View style={styles.content}>
          <Animated.View style={motion.heroStyle}>
            <RiderAmountHero amountPsw={dashboard.data.totalAmountReceivedPsw} />
          </Animated.View>
          <Animated.View style={[styles.content, motion.contentStyle]}>
            <RiderActivityCard
              assigned={dashboard.data.assignedCount}
              completed={dashboard.data.completedCount}
              returned={dashboard.data.returnedCount}
            />
            <RiderPaymentBreakdown
              toBePaidReceivedPsw={dashboard.data.toBePaidReceivedPsw}
              deliveryFeeReceivedPsw={dashboard.data.deliveryFeeReceivedPsw}
            />
            <RiderQuickActions date={dashboard.data.date} />
          </Animated.View>
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: mobileSpacing.xxxl },
  content: { gap: mobileSpacing.md },
});
