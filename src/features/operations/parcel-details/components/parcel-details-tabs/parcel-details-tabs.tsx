import { type ReactNode, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ParcelFullDetails } from '@/features/operations/parcel/api/parcel.api';
import type { ParcelDetailsTab, ParcelHistoryEvent } from '../../types';
import { CustodySection } from '../parcel-details-sections/custody-section';
import { DeliverySection } from '../parcel-details-sections/delivery-section';
import { HandledBySection } from '../parcel-details-sections/handled-by-section';
import { HistorySection } from '../parcel-details-sections/history-section';
import { OverviewSection } from '../parcel-details-sections/overview-section';
import { PaymentsSection } from '../parcel-details-sections/payments-section';
import { PeopleRouteSection } from '../parcel-details-sections/people-route-section';
import { StorageSection } from '../parcel-details-sections/storage-section';

type ParcelDetailsTabsProps = {
  details: ParcelFullDetails;
  branchNameById: Map<string, string>;
  history: { events: ParcelHistoryEvent[]; isLoading: boolean; isError: boolean };
  actions?: ReactNode;
};

export function ParcelDetailsTabs({
  details,
  branchNameById,
  history,
  actions,
}: ParcelDetailsTabsProps) {
  const [tab, setTab] = useState<ParcelDetailsTab>('overview');
  const tabs: Array<[ParcelDetailsTab, string]> = [
    ['overview', 'Overview'],
    ['people', 'People & Route'],
    ['payments', `Payments (${details.payments.length})`],
    ['delivery', 'Delivery'],
    ['custody', 'Custody'],
    ['storage', 'Storage'],
    ['handled-by', 'Handled By'],
    ['history', `History${history.events.length ? ` (${history.events.length})` : ''}`],
    ...(actions ? ([['actions', 'Actions']] as Array<[ParcelDetailsTab, string]>) : []),
  ];

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as ParcelDetailsTab)}>
      <TabsList className="h-auto w-full flex-wrap justify-start">
        {tabs.map(([value, label]) => (
          <TabsTrigger key={value} value={value} className="flex-none">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="overview">
        <OverviewSection details={details} />
      </TabsContent>
      <TabsContent value="people">
        <PeopleRouteSection details={details} branchNameById={branchNameById} />
      </TabsContent>
      <TabsContent value="payments">
        <PaymentsSection details={details} />
      </TabsContent>
      <TabsContent value="delivery">
        <DeliverySection details={details} />
      </TabsContent>
      <TabsContent value="custody">
        <CustodySection details={details} branchNameById={branchNameById} />
      </TabsContent>
      <TabsContent value="storage">
        <StorageSection details={details} />
      </TabsContent>
      <TabsContent value="handled-by">
        <HandledBySection details={details} />
      </TabsContent>
      <TabsContent value="history">
        <HistorySection
          events={history.events}
          isLoading={history.isLoading}
          isError={history.isError}
        />
      </TabsContent>
      {actions ? <TabsContent value="actions">{actions}</TabsContent> : null}
    </Tabs>
  );
}
