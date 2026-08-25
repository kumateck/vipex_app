import { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { AppScreen } from '@mobile/components/screen';
import { router } from '@mobile/navigation/router-compat';
import { reportDateFromSession } from '@mobile/features/reporting/cashier-sales-report';
import { mobileSpacing } from '@mobile/theme/layout';
import { CloseCashierSessionDialog, OpenCashierSessionDialog } from '../../dialogs';
import { useCashierDashboard, useCashierSessionActions, useDashboardMotion } from '../../hooks';
import { expectedClosingBalancePsw, isActiveSession } from '../../utils';
import { ActiveSessionCard } from './active-session-card';
import { CashierDashboardHeader } from './cashier-dashboard-header';
import { CashierReportLinkCard } from './cashier-report-link-card';
import {
  CashierDashboardAccessNotice,
  CashierDashboardError,
  CashierDashboardLoading,
} from './cashier-dashboard-state';

export function CashierDashboard() {
  const dashboard = useCashierDashboard();
  const motion = useDashboardMotion();
  const [openDialogVisible, setOpenDialogVisible] = useState(false);
  const [closeDialogVisible, setCloseDialogVisible] = useState(false);
  const actions = useCashierSessionActions({
    canReadSessionTypes: dashboard.access.sessionTypes,
    onChanged: dashboard.refresh,
  });
  const session = dashboard.data.activeSession;
  const hasActiveSession = Boolean(session && isActiveSession(session.status));
  const expectedBalancePsw = expectedClosingBalancePsw(
    dashboard.data.activeSummary,
    dashboard.cashierType,
  );

  const showOpenDialog = () => {
    actions.clearActionError();
    setOpenDialogVisible(true);
    void actions.loadSessionTypes();
  };

  const showCloseDialog = () => {
    actions.clearActionError();
    setCloseDialogVisible(true);
  };

  const sessionAction = hasActiveSession
    ? dashboard.access.closeSession
      ? { title: 'Close Session', onPress: showCloseDialog }
      : undefined
    : dashboard.access.openSession
      ? { title: 'Open Session', onPress: showOpenDialog }
      : undefined;

  return (
    <AppScreen
      style={styles.screen}
      refreshing={dashboard.refreshing}
      onRefresh={dashboard.refresh}
    >
      <Animated.View style={motion.headerStyle}>
        <CashierDashboardHeader />
      </Animated.View>

      {dashboard.error ? (
        <CashierDashboardError message={dashboard.error} onRetry={dashboard.refresh} />
      ) : null}
      {!dashboard.access.sessions ? <CashierDashboardAccessNotice /> : null}

      {dashboard.loading ? (
        <CashierDashboardLoading />
      ) : (
        <>
          {dashboard.access.sessions ? (
            <Animated.View style={motion.heroStyle}>
              <ActiveSessionCard
                session={session}
                summary={dashboard.data.activeSummary}
                action={sessionAction}
              />
            </Animated.View>
          ) : null}
          <Animated.View style={[styles.content, motion.contentStyle]}>
            {dashboard.access.report ? (
              <CashierReportLinkCard
                onPress={() =>
                  router.push({
                    pathname: '/(app)/cashier-sales-report',
                    params: { date: reportDateFromSession(session?.scheduledStartTime) },
                  })
                }
              />
            ) : null}
          </Animated.View>
        </>
      )}

      <OpenCashierSessionDialog
        visible={openDialogVisible}
        busy={actions.opening}
        loadingTypes={actions.loadingSessionTypes}
        error={actions.actionError}
        sessionTypes={actions.sessionTypes}
        onClose={() => setOpenDialogVisible(false)}
        onConfirm={(input) => {
          void actions.openSession(input).then((success) => {
            if (success) setOpenDialogVisible(false);
          });
        }}
      />
      <CloseCashierSessionDialog
        visible={closeDialogVisible}
        busy={actions.closing}
        error={actions.actionError}
        expectedBalancePsw={expectedBalancePsw}
        onClose={() => setCloseDialogVisible(false)}
        onConfirm={() => {
          if (!session?.id) return;
          void actions
            .closeSession({
              sessionId: session.id,
              closingBalanceCedis: expectedBalancePsw / 100,
            })
            .then((success) => {
              if (success) setCloseDialogVisible(false);
            });
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: mobileSpacing.xxxl },
  content: { gap: mobileSpacing.md },
});
