import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { ParcelStatus } from '@/db/schemas/enums';
import {
  PendingDeliveryChangeRequestsCard,
  ReviewDeliveryChangeRequestDialog,
} from '@/features/operations/delivery-change-requests';
import { EMPTY_META } from '../../home-delivery-pickup/utils';
import { ParcelHomeDeliveryAddressDialog } from './dialogs';
import { useHomeDeliveryAddress } from './hooks';
import { useHomeDeliveryAddressColumns } from './use-home-delivery-address-columns';

export function ParcelHomeDeliveryAddress() {
  const state = useHomeDeliveryAddress();
  const {
    companyId,
    branchId,
    searchInput,
    setSearchInput,
    selectedParcel,
    dropoffAddress,
    setDropoffAddress,
    deliveryFee,
    setDeliveryFee,
    isSaving,
    listQuery,
    changeReview,
    onSubmit,
    onSearch,
    onRequestChange,
    onClose,
  } = state;
  const columns = useHomeDeliveryAddressColumns(state);
  return (
    <div className="w-full p-4 space-y-4">
      <PendingDeliveryChangeRequestsCard
        requests={changeReview.requests}
        isLoading={changeReview.isLoading}
        onReview={changeReview.open}
      />

      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Home Delivery Address Collection</CardTitle>
            <CardDescription>
              Call receiver, collect home address and delivery fee, then move to address collected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                onSearch();
              }}
            >
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by tracking, booking, receiver"
              />
              <Button type="submit">Search</Button>
            </form>
            <DataTable
              mode="server"
              data={listQuery.data?.data ?? []}
              columns={columns}
              meta={listQuery.data?.meta ?? EMPTY_META}
              loading={listQuery.isLoading}
              showSearch={false}
              serverFilters={{
                companyId,
                destinationId: branchId,
                status: ParcelStatus.HOME_DELIVERY_REQUESTED,
              }}
              onRequestChange={onRequestChange}
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>

      <ParcelHomeDeliveryAddressDialog
        parcel={selectedParcel}
        dropoffAddress={dropoffAddress}
        onDropoffAddressChange={setDropoffAddress}
        deliveryFee={deliveryFee}
        onDeliveryFeeChange={setDeliveryFee}
        isSaving={isSaving}
        onClose={onClose}
        onSubmit={onSubmit}
      />
      <ReviewDeliveryChangeRequestDialog
        request={changeReview.selected}
        isSubmitting={changeReview.isSubmitting}
        onClose={changeReview.close}
        onSubmit={changeReview.submit}
      />
    </div>
  );
}
