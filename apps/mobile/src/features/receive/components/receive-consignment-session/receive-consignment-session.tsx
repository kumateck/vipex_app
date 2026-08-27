import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from '@mobile/navigation/router-compat';
import { AppScreen } from '@mobile/components/screen';
import { hapticTap } from '@mobile/lib/haptics';
import { canViewIncomingConsignments } from '@mobile/lib/permissions';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useAuth } from '@mobile/providers/auth-provider';
import { AppButton, MobileNoAccess } from '@/components/ui/mobile';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { CloseConsignmentExceptionsDialog } from '../../dialogs';
import { useReceiveConsignmentSession } from '../../hooks';
import { ConsignmentChecklistCard } from './consignment-checklist-card';
import { ConsignmentScannerCard } from './consignment-scanner-card';

const OPEN_CONSIGNMENT_STATUS = 0;

export function ReceiveConsignmentSession() {
  const { theme } = useAppearance();
  const { session } = useAuth();
  const router = useRouter();
  const canView = canViewIncomingConsignments(session.user?.permissions ?? []);
  const sessionState = useReceiveConsignmentSession();
  const isOpen = sessionState.consignment?.status === OPEN_CONSIGNMENT_STATUS;
  const arrived = sessionState.consignment?.arrived ?? 0;
  const total = sessionState.consignment?.total ?? 0;

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to receive consignments." />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Receive {sessionState.consignment?.code ?? ''}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
            Scan each parcel to receive it against this consignment.
          </Text>
        </View>
        <View style={styles.tally}>
          <Text style={[styles.tallyNumber, { color: theme.colors.secondary }]}>
            {arrived}/{total}
          </Text>
          <Text style={[styles.tallyLabel, { color: theme.colors.textSubtle }]}>arrived</Text>
        </View>
      </View>
      {isOpen && sessionState.canReceive ? (
        <ConsignmentScannerCard
          manualCode={sessionState.manualCode}
          scanBusy={sessionState.scanBusy}
          onChangeManualCode={sessionState.setManualCode}
          onReceive={(code) => void sessionState.receiveByCode(code)}
        />
      ) : null}
      <ConsignmentChecklistCard items={sessionState.items} loading={sessionState.loading} />
      {isOpen ? (
        <View
          style={[
            styles.footer,
            mobileShadow.floating,
            {
              backgroundColor: theme.colors.bgElevated,
              borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
              borderWidth: theme.scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
            },
          ]}
        >
          <AppButton
            title="Back"
            onPress={() => {
              router.back();
              void hapticTap();
            }}
            variant="secondary"
          />
          <AppButton
            title={sessionState.closeBusy ? 'Closing...' : 'Close Consignment'}
            onPress={() => void sessionState.closeConsignmentSession()}
            disabled={sessionState.closeBusy}
          />
        </View>
      ) : null}
      <CloseConsignmentExceptionsDialog
        busy={sessionState.closeBusy}
        missingCount={sessionState.missingCount}
        reason={sessionState.exceptionReason}
        visible={sessionState.reasonModalOpen}
        onChangeReason={sessionState.setExceptionReason}
        onClose={() => {
          sessionState.setReasonModalOpen(false);
          sessionState.setExceptionReason('');
        }}
        onConfirm={() => void sessionState.confirmCloseWithExceptions()}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.sm },
  headerText: { flex: 1 },
  title: { ...mobileTextStyles.title1 },
  subtitle: { ...mobileTextStyles.subhead, marginTop: -2 },
  tally: { alignItems: 'flex-end' },
  tallyNumber: { ...mobileTextStyles.title2, fontWeight: '800' },
  tallyLabel: { ...mobileTextStyles.caption1 },
  footer: {
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.sm + 2,
    gap: mobileSpacing.sm,
    flexDirection: 'row',
  },
});
