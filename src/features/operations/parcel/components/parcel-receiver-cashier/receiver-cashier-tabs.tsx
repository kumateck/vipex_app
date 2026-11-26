import { memo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type ReceiverCashierView = 'awaiting' | 'signatures' | 'delivered';

export const ReceiverCashierTabs = memo(function ReceiverCashierTabs({
  value,
  onChange,
}: {
  value: ReceiverCashierView;
  onChange: (view: ReceiverCashierView) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as ReceiverCashierView)}>
      <TabsList aria-label="Receiver Cashier lists">
        <TabsTrigger value="awaiting">Awaiting Pickup</TabsTrigger>
        <TabsTrigger value="signatures">Receiver signatures</TabsTrigger>
        <TabsTrigger value="delivered">Delivered</TabsTrigger>
      </TabsList>
    </Tabs>
  );
});
