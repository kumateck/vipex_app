import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AppScreen } from '@mobile/components/screen';
import { MobileNoAccess } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { useAssignedDeliveries, useAssignedDeliveriesMotion } from '../../hooks';
import { AssignedDeliveriesHeader } from './assigned-deliveries-header';
import { AssignedDeliveriesSummary } from './assigned-deliveries-summary';
import { AssignedDeliveriesSearch } from './assigned-deliveries-search';
import { AssignedDeliveryCard } from './assigned-delivery-card';
import { AssignedDeliveryDetails } from './assigned-delivery-details';
import { AssignedDeliveriesEmpty, AssignedDeliveriesLoading } from './assigned-deliveries-state';
import { DeliveryChangeRequestDialog, DeliverySignatureDialog } from '../../dialogs';

export function AssignedDeliveriesScreen() {
  const deliveries = useAssignedDeliveries();
  const motion = useAssignedDeliveriesMotion();
  const { theme } = useAppearance();

  if (!deliveries.canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access rider operations." />
      </AppScreen>
    );
  }

  const showInitialLoading = deliveries.refreshing && deliveries.currentRows.length === 0;
  const hasSearch = Boolean(deliveries.search.trim());
  const signatureDelivery =
    deliveries.currentRows.find((row) => row.parcelId === deliveries.signatureParcelId) ?? null;

  return (
    <>
      <AppScreen
        style={styles.screen}
        refreshing={deliveries.refreshing}
        onRefresh={deliveries.refresh}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={motion.headerStyle}>
          <AssignedDeliveriesHeader />
        </Animated.View>
        <Animated.View style={motion.summaryStyle}>
          <AssignedDeliveriesSummary
            count={deliveries.currentRows.length}
            expectedPsw={deliveries.totalExpectedPsw}
          />
        </Animated.View>
        <Animated.View style={[styles.content, motion.listStyle]}>
          <AssignedDeliveriesSearch
            value={deliveries.search}
            onChange={deliveries.setSearch}
            onClear={deliveries.clearSearch}
          />
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Delivery queue</Text>
            <Text style={[styles.sectionCount, { color: theme.colors.textSubtle }]}>
              {deliveries.assignedRows.length}{' '}
              {deliveries.assignedRows.length === 1 ? 'stop' : 'stops'}
            </Text>
          </View>

          {showInitialLoading ? (
            <AssignedDeliveriesLoading />
          ) : deliveries.assignedRows.length === 0 ? (
            <AssignedDeliveriesEmpty
              filtered={hasSearch}
              onReset={deliveries.clearSearch}
              onRefresh={deliveries.refresh}
            />
          ) : (
            <View style={styles.list}>
              {deliveries.assignedRows.map((delivery) => {
                const expanded = deliveries.selectedParcelId === delivery.parcelId;
                return (
                  <View key={delivery.parcelId} style={styles.deliveryItem}>
                    <AssignedDeliveryCard
                      delivery={delivery}
                      expanded={expanded}
                      onToggle={deliveries.toggleParcel}
                    />
                    {expanded ? (
                      <AssignedDeliveryDetails
                        delivery={delivery}
                        canComplete={deliveries.canCompleteDelivery}
                        hasPendingChange={deliveries.pendingChangeParcelIds.has(delivery.parcelId)}
                        activeAction={deliveries.activeAction}
                        onConfirm={deliveries.openSignature}
                        onRequestChange={deliveries.openChangeRequest}
                        onReturn={(parcelId) => void deliveries.runAction(parcelId, 'returned')}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </AppScreen>
      {signatureDelivery ? (
        <DeliverySignatureDialog
          key={signatureDelivery.parcelId}
          delivery={signatureDelivery}
          busy={deliveries.activeAction?.type === 'delivered'}
          onClose={deliveries.closeSignature}
          onConfirm={(input) => void deliveries.confirmHandover(input)}
        />
      ) : null}
      {deliveries.changeRequestTarget ? (
        <DeliveryChangeRequestDialog
          key={deliveries.changeRequestTarget.parcelId}
          target={deliveries.changeRequestTarget}
          busy={deliveries.isSubmittingChange}
          onClose={deliveries.closeChangeRequest}
          onSubmit={(input) => void deliveries.submitChangeRequest(input)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: mobileSpacing.xxxl },
  content: { gap: mobileSpacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...mobileTextStyles.headline },
  sectionCount: { ...mobileTextStyles.caption1, fontWeight: '600' },
  list: { gap: mobileSpacing.md },
  deliveryItem: { gap: mobileSpacing.sm },
});
