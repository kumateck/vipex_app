import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeliveryCashierSecondReceivers } from '../../delivery-cashier-second-receivers';
import { ParcelSessionGuard } from '../parcel-session-guard';
import { DeliveryCashierTable } from './delivery-cashier-table';
import { FinalizeDeliveryDialog } from './dialogs';
import { useDeliveryCashier } from './hooks';

export function ParcelDeliveryCashier() {
  const {
    canManageSecondReceivers,
    companyId,
    branchId,
    searchInput,
    setSearchInput,
    onSearch,
    onRequestChange,
    listQuery,
    selectedParcel,
    setSelectedParcel,
    deliveryAddress,
    assignedRiderLabel,
    deliveryAtLabel,
    configuredDeliveryFeePsw,
    outstanding,
    hasToBePaidOutstanding,
    outstandingTotalPsw,
    principalAmount,
    setPrincipalAmount,
    deliveryFeeAmount,
    setDeliveryFeeAmount,
    paymentMethod,
    setPaymentMethod,
    isFinalizing,
    isRefreshing,
    isFinalizeConfirmOpen,
    setIsFinalizeConfirmOpen,
    closeFinalizeDialog,
    onFinalize,
    onReturnToPickup,
    isReturningToPickup,
  } = useDeliveryCashier();
  return (
    <div className="w-full space-y-4 p-4">
      <ParcelSessionGuard>
        <Tabs defaultValue="finalization" className="gap-4">
          <TabsList aria-label="Delivery cashier workflows" className="w-full sm:w-fit">
            <TabsTrigger value="finalization">Finalization</TabsTrigger>
            {canManageSecondReceivers ? (
              <TabsTrigger value="upcoming-handovers">Upcoming Handovers</TabsTrigger>
            ) : null}
          </TabsList>
          <TabsContent value="finalization">
            <DeliveryCashierTable
              companyId={companyId}
              branchId={branchId}
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onSearchSubmit={onSearch}
              data={listQuery.data?.data ?? []}
              meta={listQuery.data?.meta}
              loading={listQuery.isLoading}
              onRequestChange={onRequestChange}
              onFinalize={setSelectedParcel}
              onReturnToPickup={onReturnToPickup}
              isReturningToPickup={isReturningToPickup}
            />
          </TabsContent>
          {canManageSecondReceivers ? (
            <TabsContent value="upcoming-handovers">
              <DeliveryCashierSecondReceivers />
            </TabsContent>
          ) : null}
        </Tabs>

        <FinalizeDeliveryDialog
          parcel={selectedParcel}
          deliveryAddress={deliveryAddress}
          assignedRiderLabel={assignedRiderLabel}
          deliveryAtLabel={deliveryAtLabel}
          configuredDeliveryFeePsw={configuredDeliveryFeePsw}
          outstanding={outstanding}
          hasToBePaidOutstanding={hasToBePaidOutstanding}
          outstandingTotalPsw={outstandingTotalPsw}
          principalAmount={principalAmount}
          onPrincipalAmountChange={setPrincipalAmount}
          deliveryFeeAmount={deliveryFeeAmount}
          onDeliveryFeeAmountChange={setDeliveryFeeAmount}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          isFinalizing={isFinalizing}
          isRefreshing={isRefreshing}
          isFinalizeConfirmOpen={isFinalizeConfirmOpen}
          onFinalizeConfirmOpenChange={setIsFinalizeConfirmOpen}
          onClose={closeFinalizeDialog}
          onFinalize={onFinalize}
        />
      </ParcelSessionGuard>
    </div>
  );
}
